// 智慧通知模式（Smart Notification）— 集中管理的通知觸發邏輯。
//
// 原則：不再每一筆報名都推播，只在下列情況發送，且同一時間只發
// 最高優先權的一則（優先權由高到低）：
//   1. 接龍額滿（full_capacity）
//   2. 報名截止（registration_closed，由每日排程觸發）
//   3. 第一位報名（first_signup）
//   4. 里程碑：5、10、20、30、50、100 人，破百後每 +10 人一次
//   5. 10 分鐘摘要：10 分鐘內新增 2 位以上、且距上一則通知滿 10 分鐘
//
// 現場排隊任務不發任何 LINE 通知。排隊情境本來就是現場即時處理，
// 報名者會在前台同步看到等待狀態，主辦人不需要額外收到推播。

import { sendLinePush } from "@/lib/linePush";
import { isHeadcountUnit, isQueueTask } from "@/lib/utils";

const SUMMARY_WINDOW_MS = 10 * 60 * 1000;
const MILESTONES = [5, 10, 20, 30, 50, 100];

function viewListLink(taskId) {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) return "";
  return `\n\n👉 查看完整名單\nhttps://liff.line.me/${liffId}/my-tasks/${taskId}`;
}

async function getTotals(supabase, task) {
  if (isHeadcountUnit(task.quantity_unit)) {
    const { data } = await supabase
      .from("signups")
      .select("quantity")
      .eq("task_id", task.id);
    const rows = data?.length || 0;
    const people = (data || []).reduce((sum, r) => sum + (r.quantity || 1), 0);
    return { rows, people };
  }

  const { count } = await supabase
    .from("signups")
    .select("id", { count: "exact", head: true })
    .eq("task_id", task.id);
  return { rows: count || 0, people: count || 0 };
}

function crossedMilestone(people) {
  if (people >= 100) return Math.floor(people / 10) * 10;
  let milestone = null;
  for (const x of MILESTONES) {
    if (people >= x) milestone = x;
  }
  return milestone;
}

async function getCapacityCycle(supabase, taskId) {
  const { data } = await supabase
    .from("notification_log")
    .select("event_key")
    .eq("task_id", taskId)
    .or("event_key.like.full%,event_key.like.capacity_freed%");

  let fullCount = 0;
  let freedCount = 0;
  for (const row of data || []) {
    if (row.event_key === "full_capacity" || row.event_key.startsWith("full_again_")) fullCount++;
    else if (row.event_key.startsWith("capacity_freed_")) freedCount++;
  }
  return { fullCount, freedCount };
}

async function claim(supabase, taskId, eventKey) {
  const { error } = await supabase
    .from("notification_log")
    .insert({ task_id: taskId, event_key: eventKey });
  return !error;
}

async function recordCapacityFreed(supabase, taskId) {
  const { fullCount, freedCount } = await getCapacityCycle(supabase, taskId);
  if (fullCount === 0 || freedCount >= fullCount) return;
  await claim(supabase, taskId, `capacity_freed_${fullCount}`);
}

export async function handleSignupRemoved({ supabase, task }) {
  try {
    if (isQueueTask(task)) return;
    if (!task?.max_signups) return;
    const { people } = await getTotals(supabase, task);
    if (people < task.max_signups) {
      await recordCapacityFreed(supabase, task.id);
    }
  } catch (err) {
    console.warn("capacity freed record failed", err);
  }
}

export async function notifySignupActivity({ supabase, task, signup }) {
  try {
    if (!task?.creator_id || task.notify_enabled === false) return;
    if (isQueueTask(task)) return;

    const { rows, people } = await getTotals(supabase, task);
    const link = viewListLink(task.id);
    const candidates = [];

    if (task.max_signups && people >= task.max_signups) {
      const { fullCount, freedCount } = await getCapacityCycle(supabase, task.id);
      if (fullCount === 0) {
        candidates.push({
          key: "full_capacity",
          text: `🈵 報名額滿！\n\n「${task.title}」已達 ${task.max_signups} 人上限。\n\n目前共 ${people} 人報名${link}`,
        });
      } else if (freedCount >= fullCount) {
        candidates.push({
          key: `full_again_${fullCount}`,
          text: `🈵 名額再次額滿！\n\n「${task.title}」稍早有人取消報名，空出的名額已由新報名者補滿。\n\n目前共 ${people} 人報名（上限 ${task.max_signups} 人）${link}`,
        });
      }
    } else if (task.max_signups && people < task.max_signups) {
      await recordCapacityFreed(supabase, task.id);
    }

    if (rows === 1 && signup?.name) {
      candidates.push({
        key: "first_signup",
        text: `🎉 有人開始報名了！\n\n${signup.name} 已報名「${task.title}」\n\n目前共 ${people} 人報名${link}`,
      });
    }

    const milestone = crossedMilestone(people);
    if (milestone) {
      candidates.push({
        key: `milestone_${milestone}`,
        text: `📢 最新報名進度\n\n「${task.title}」目前已有 ${people} 人完成報名。${link}`,
      });
    }

    for (const c of candidates) {
      if (await claim(supabase, task.id, c.key)) {
        await sendLinePush(task.creator_id, c.text);
        return;
      }
    }

    const windowStart = new Date(Date.now() - SUMMARY_WINDOW_MS).toISOString();
    const { count: recentRows } = await supabase
      .from("signups")
      .select("id", { count: "exact", head: true })
      .eq("task_id", task.id)
      .gte("created_at", windowStart);
    if (!recentRows || recentRows < 2) return;

    const { data: lastLog } = await supabase
      .from("notification_log")
      .select("created_at")
      .eq("task_id", task.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (lastLog?.length && Date.now() - new Date(lastLog[0].created_at).getTime() < SUMMARY_WINDOW_MS) {
      return;
    }

    const bucket = Math.floor(Date.now() / SUMMARY_WINDOW_MS);
    if (await claim(supabase, task.id, `summary_${bucket}`)) {
      await sendLinePush(
        task.creator_id,
        `🔥 最近 10 分鐘新增 ${recentRows} 位報名者\n\n「${task.title}」目前共 ${people} 人報名${link}`
      );
    }
  } catch (err) {
    console.warn("smart notify failed", err);
  }
}

export async function notifyRegistrationClosed(supabase) {
  const tz = "Asia/Taipei";
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  const cutoffStr = new Date(Date.now() - 3 * 86400000).toLocaleDateString("en-CA", {
    timeZone: tz,
  });

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, creator_id, notify_enabled, quantity_unit, end_date, task_mode")
    .lt("end_date", todayStr)
    .gte("end_date", cutoffStr);

  let sent = 0;
  for (const task of tasks || []) {
    if (!task.creator_id || task.notify_enabled === false) continue;
    if (isQueueTask(task)) continue;
    if (!(await claim(supabase, task.id, "registration_closed"))) continue;
    const { people } = await getTotals(supabase, task);
    await sendLinePush(
      task.creator_id,
      `⏰ 報名已截止\n\n「${task.title}」的報名時間已截止。\n\n目前共 ${people} 人報名${viewListLink(task.id)}`
    );
    sent++;
  }
  return sent;
}
