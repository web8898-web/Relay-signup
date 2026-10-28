-- Admission order is immutable; the displayed position is its current rank.
-- Backfill existing tasks in their current chronological order exactly once.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
lock table public.signups, public.tasks in access exclusive mode;

-- Verify that this metadata migration does not modify existing signup fields.
create temporary table signup_order_baseline on commit drop as
select id, md5((to_jsonb(s) - 'signup_order')::text) as fingerprint from public.signups s;

alter table public.tasks add column if not exists next_signup_order integer not null default 1;
alter table public.signups add column if not exists signup_order integer;

-- No concurrent writes can pass the table lock. Only the new number column is
-- backfilled; skip the unrelated legacy name/quantity checks on historical rows.
alter table public.signups disable trigger signup_integrity;
with numbered as (
  select id, row_number() over (partition by task_id order by created_at, id)::integer as number
  from public.signups
)
update public.signups s set signup_order = n.number from numbered n
where s.id = n.id and s.signup_order is null;
alter table public.signups enable trigger signup_integrity;

update public.tasks t set next_signup_order = greatest(t.next_signup_order,
  coalesce((select max(s.signup_order) + 1 from public.signups s where s.task_id = t.id), 1));
alter table public.signups alter column signup_order set not null;
create unique index if not exists signups_task_order_key on public.signups(task_id, signup_order);

create or replace function public.assign_signup_order()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if TG_OP = 'UPDATE' then
    if NEW.signup_order is distinct from OLD.signup_order then
      raise exception '報名順序不可變更';
    end if;
    return NEW;
  end if;
  -- UPDATE locks the same task row as the integrity guard. Order allocation,
  -- admission and the batch insert commit/rollback together. Ignore caller IDs.
  update public.tasks set next_signup_order = next_signup_order + 1
    where id = NEW.task_id returning next_signup_order - 1 into NEW.signup_order;
  if not found then raise exception '找不到這個任務'; end if;
  return NEW;
end;
$$;
drop trigger if exists signup_order on public.signups;
create trigger signup_order before insert or update on public.signups
for each row execute function public.assign_signup_order();
revoke all on function public.assign_signup_order() from public, anon, authenticated;

-- Read the entire list from one snapshot: OFFSET pages can skip/duplicate rows
-- if a participant is cancelled between requests. Only the server may call it.
create or replace function public.signup_list_snapshot(p_task_ids uuid[])
returns jsonb language sql stable security invoker set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'task_id',task_id,'signup_order',signup_order,'name',name,'note',note,
    'categories',categories,'quantity',quantity,'category_quantities',category_quantities,
    'checked_in',checked_in,'batch_id',batch_id,'created_at',created_at
  ) order by task_id,signup_order,id),'[]'::jsonb)
  from public.signups where task_id = any(p_task_ids);
$$;
revoke all on function public.signup_list_snapshot(uuid[]) from public, anon, authenticated;
grant execute on function public.signup_list_snapshot(uuid[]) to service_role;

-- Queue position still moves forward after completion/cancellation, while its
-- underlying admission order is independent of request clocks and arrival time.
create or replace function public.queue_status_snapshot(p_task_id uuid, p_owner_token text)
returns jsonb language sql stable security invoker set search_path = public, pg_temp as $$
  with ranked as materialized (
    select s.*, sum(case when not coalesce(checked_in,false) then 1 else 0 end) over (order by signup_order,id) as position
    from public.signups s where task_id = p_task_id
  ), own as (
    select coalesce(jsonb_agg(jsonb_build_object('id',id,'task_id',task_id,'signup_order',signup_order,'name',name,'checked_in',checked_in,'created_at',created_at) order by signup_order,id),'[]'::jsonb) as entries,
      coalesce(min(position) filter (where not coalesce(checked_in,false)),0) as rank
    from ranked where owner_token = p_owner_token
  )
  select jsonb_build_object(
    'waiting_count',(select count(*) from ranked where not coalesce(checked_in,false)),
    'completed_count',(select count(*) from ranked where checked_in),
    'queue_number',own.rank,'people_ahead',greatest(0,own.rank-1),'my_signups',own.entries
  ) from own;
$$;
revoke all on function public.queue_status_snapshot(uuid,text) from public, anon, authenticated;
grant execute on function public.queue_status_snapshot(uuid,text) to service_role;
do $$ begin
  if exists (
    select 1 from signup_order_baseline b full join public.signups s on s.id = b.id
    where b.id is null or s.id is null or b.fingerprint is distinct from md5((to_jsonb(s) - 'signup_order')::text)
  ) then raise exception 'Historical signup fields changed; rolling back migration'; end if;
end $$;
notify pgrst, 'reload schema';
commit;
