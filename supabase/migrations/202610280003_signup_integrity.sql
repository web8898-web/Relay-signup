-- Serialize signup mutations per task, so concurrent requests cannot oversubscribe.
-- Existing rows are preserved; checks apply to new admissions / increased occupancy.
begin;
create or replace function public.guard_signup_integrity()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare
  t public.tasks%rowtype;
  queue boolean;
  people boolean;
  used bigint;
  incoming bigint;
  previous bigint := 0;
begin
  if TG_OP = 'DELETE' then
    perform 1 from public.tasks where id = OLD.task_id for update;
    return OLD;
  end if;
  if TG_OP = 'UPDATE' and (NEW.task_id <> OLD.task_id or NEW.owner_token <> OLD.owner_token) then
    raise exception '不可變更報名所屬任務或驗證資訊';
  end if;
  select * into strict t from public.tasks where id = NEW.task_id for update;
  queue := t.task_mode = 'queue' or t.categories ? '__relay_queue_mode__' or position('排隊' in t.title) > 0;
  people := coalesce(t.quantity_unit in ('人','位','名','口'), false);
  if btrim(NEW.name) = '' then raise exception '請輸入姓名'; end if;
  if NEW.quantity is not null and NEW.quantity <= 0 then raise exception '數量必須大於零'; end if;
  if TG_OP = 'INSERT' or (queue and OLD.checked_in and not NEW.checked_in) then
    if t.start_date > (now() at time zone 'Asia/Taipei')::date then raise exception '此任務尚未開始'; end if;
    if t.end_date < (now() at time zone 'Asia/Taipei')::date then raise exception '此任務已截止，無法再接龍'; end if;
  end if;
  if queue and not NEW.checked_in and (TG_OP = 'INSERT' or OLD.checked_in) and exists (
    select 1 from public.signups s where s.task_id = NEW.task_id and s.owner_token = NEW.owner_token and not s.checked_in and s.id <> NEW.id
  ) then raise exception '你目前已在排隊中，完成後才能重新加入排隊'; end if;
  if TG_OP = 'INSERT' and exists (
    select 1 from public.signups s where s.task_id = NEW.task_id and s.owner_token = NEW.owner_token
      and s.created_at >= clock_timestamp() - interval '30 seconds'
      and (NEW.batch_id is null or s.batch_id is distinct from NEW.batch_id)
  ) then raise exception '請稍候 30 秒後再試一次'; end if;
  incoming := case when queue and NEW.checked_in then 0 when people then coalesce(NEW.quantity, 1) else 1 end;
  if TG_OP = 'UPDATE' then
    previous := case when queue and OLD.checked_in then 0 when people then coalesce(OLD.quantity, 1) else 1 end;
  end if;
  if t.max_signups is not null and incoming > previous then
    select coalesce(sum(case when people then coalesce(s.quantity, 1) else 1 end), 0) into used
      from public.signups s where s.task_id = NEW.task_id and s.id <> NEW.id and (not queue or not s.checked_in);
    if used + incoming > t.max_signups then raise exception '這個任務已經額滿了'; end if;
  end if;
  return NEW;
end;
$$;
drop trigger if exists signup_integrity on public.signups;
create trigger signup_integrity before insert or update or delete on public.signups for each row execute function public.guard_signup_integrity();
revoke all on function public.guard_signup_integrity() from public, anon, authenticated;

-- One database snapshot for counts, rank and own rows. No PostgREST row limit or
-- participant credentials/names belonging to other browsers in the response.
create or replace function public.queue_status_snapshot(p_task_id uuid, p_owner_token text)
returns jsonb language sql stable security invoker set search_path = public, pg_temp as $$
  with ranked as materialized (
    select s.*, sum(case when not checked_in then 1 else 0 end) over (order by created_at, id) as position
    from public.signups s where task_id = p_task_id
  ), own as (
    select coalesce(jsonb_agg(jsonb_build_object('id',id,'task_id',task_id,'name',name,'checked_in',checked_in,'created_at',created_at) order by created_at,id),'[]'::jsonb) as entries,
      coalesce(min(position) filter (where not checked_in),0) as rank
    from ranked where owner_token = p_owner_token
  )
  select jsonb_build_object(
    'waiting_count',(select count(*) from ranked where not checked_in),
    'completed_count',(select count(*) from ranked where checked_in),
    'queue_number',own.rank,'people_ahead',greatest(0,own.rank-1),'my_signups',own.entries
  ) from own;
$$;
revoke all on function public.queue_status_snapshot(uuid,text) from public, anon, authenticated;
grant execute on function public.queue_status_snapshot(uuid,text) to service_role;
notify pgrst, 'reload schema';
commit;
