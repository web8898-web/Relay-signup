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
// 所有已發送的事件都寫入 notification_log（永久保存），同一事件
// 不會重複推播；(task_id, event_key) 唯一約束兼作併發鎖。
// 刪除報名、候補異動、活動修改等事件一律不推播。

import { sendLinePush } from "@/lib/linePush";
import { isHeadcountUnit } from "@/lib/utils";

const SUMMARY_WINDOW_MS = 10 * 60 * 1000; // 摘要通知的觀察窗與最小間隔
const MILESTONES = [5, 10, 20, 30, 50, 100];

// 「查看完整名單」按鈕（LIFF 深連結，樣式沿用原通知）
function viewListLink(taskId) {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) return "";
  return `\n\n👉 查看完整名單\nhttps://liff.line.me/${liffId}/my-tasks/${taskId}`;
}

// 累計報名數：一般任務算「筆數」；人頭單位（人／位／名／口）的任務
// 依畫面顯示邏輯改算人頭總數（每筆的 quantity 已含報名者本人）。
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

// 目前人數所跨過的最高里程碑。
// 例：people=23 → 20；people=123 → 120；people=4 → null。
function crossedMilestone(people) {
  if (people >= 100) return Math.floor(people / 10) * 10;
  let m = null;
  for (const x of MILESTONES) {
    if (people >= x) m = x;
  }
  return m;
}

// 額滿循環狀態：fullCount = 已發過幾次額滿通知（full_capacity 與
// full_again_*），freedCount = 額滿之後名額空出過幾次（capacity_freed_*）。
// freedCount >= fullCount 代表「上次額滿之後有人取消過」→ 再次補滿
// 時要發「名額再次額滿」通知。
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

// 悄悄記錄「額滿後名額空出」：不發任何通知，只在通知紀錄裡標記
// 這一輪額滿已被打破，讓下次補滿時能發「名額再次額滿」。
// 每一輪額滿最多記一次（事件鍵帶輪次編號＋唯一約束）。
async function recordCapacityFreed(supabase, taskId) {
  const { fullCount, freedCount } = await getCapacityCycle(supabase, taskId);
  if (fullCount === 0 || freedCount >= fullCount) return; // 沒額滿過，或本輪已記錄
  await claim(supabase, taskId, `capacity_freed_${fullCount}`);
}

// 有人刪除報名後呼叫（一樣 fire-and-forget、絕不發通知）。
// 只在「先前已額滿、刪除後人數低於上限」時記錄狀態。
export async function handleSignupRemoved({ supabase, task }) {
  try {
    if (!task?.max_signups) return;
    const { people } = await getTotals(supabase, task);
    if (people < task.max_signups) {
      await recordCapacityFreed(supabase, task.id);
    }
  } catch (err) {
    console.warn("capacity freed record failed", err);
  }
}

// 嘗試「認領」一個通知事件：成功寫入 notification_log 才回傳 true。
// 已存在（通知過）或被併發請求搶先，都會因唯一約束失敗而回傳 false，
// 呼叫端就不發送——天然避免重複推播。
async function claim(supabase, taskId, eventKey) {
  const { error } = await supabase
    .from("notification_log")
    .insert({ task_id: taskId, event_key: eventKey });
  return !error;
}

// 報名活動（新增或編輯）發生後呼叫。fire-and-forget：任何失敗都
// 不影響報名流程本身。
export async function notifySignupActivity({ supabase, task, signup }) {
  try {
    if (!task?.creator_id || task.notify_enabled === false) return;

    const { rows, people } = await getTotals(supabase, task);
    const link = viewListLink(task.id);

    // 依優先權排出本次符合條件的事件（截止通知由每日排程負責）
    const candidates = [];

    if (task.max_signups && people >= task.max_signups) {
      const { fullCount, freedCount } = await getCapacityCycle(supabase, task.id);
      if (fullCount === 0) {
        candidates.push({
          key: "full_capacity",
          text: `🈵 報名額滿！\n\n「${task.title}」已達 ${task.max_signups} 人上限。\n\n目前共 ${people} 人報名${link}`,
        });
      } else if (freedCount >= fullCount) {
        // 上次額滿後有人取消、名額空出，現在又被補滿 → 再次額滿通知
        candidates.push({
          key: `full_again_${fullCount}`,
          text: `🈵 名額再次額滿！\n\n「${task.title}」稍早有人取消報名，空出的名額已由新報名者補滿。\n\n目前共 ${people} 人報名（上限 ${task.max_signups} 人）${link}`,
        });
      }
      // 其餘情況：本輪額滿已通知過 → 保持安靜
    } else if (task.max_signups && people < task.max_signups) {
      // 編輯把人數改少也可能讓額滿解除（例如帶的人數改少），
      // 一樣只悄悄記錄狀態、不發通知
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

    // 由高到低嘗試認領，成功就發送並結束——一次只發一則
    for (const c of candidates) {
      if (await claim(supabase, task.id, c.key)) {
        await sendLinePush(task.creator_id, c.text);
        return;
      }
    }

    // 沒有新的額滿／第一位／里程碑事件 → 評估 10 分鐘摘要通知。
    // 條件：最近 10 分鐘內新增 2 位以上（短時間大量報名），
    // 且距離上一則任何通知已滿 10 分鐘。
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
    if (
      lastLog?.length &&
      Date.now() - new Date(lastLog[0].created_at).getTime() < SUMMARY_WINDOW_MS
    ) {
      return;
    }

    // 以「10 分鐘時間桶」當事件鍵，唯一約束保證每 10 分鐘最多一則
    const bucket = Math.floor(Date.now() / SUMMARY_WINDOW_MS);
    if (await claim(supabase, task.id, `summary_${bucket}`)) {
      await sendLinePush(
        task.creator_id,
        `🔥 最近 10 分鐘新增 ${recentRows} 位報名者\n\n「${task.title}」目前共 ${people} 人報名${link}`
      );
    }
  } catch (err) {
    // 通知失敗不影響報名主流程
    console.warn("smart notify failed", err);
  }
}

// 報名截止通知：由每日排程（/api/cron/close-notify）呼叫。
// 找出「今天之前、三天內」剛截止的任務發送一次截止通知；三天的
// 回溯窗是為了避免功能剛上線時，把很久以前就結束的舊任務全部
// 轟炸一輪。回傳實際發送的數量。
export async function notifyRegistrationClosed(supabase) {
  const tz = "Asia/Taipei";
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  const cutoffStr = new Date(Date.now() - 3 * 86400000).toLocaleDateString("en-CA", {
    timeZone: tz,
  });

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, creator_id, notify_enabled, quantity_unit, end_date")
    .lt("end_date", todayStr)
    .gte("end_date", cutoffStr);

  let sent = 0;
  for (const task of tasks || []) {
    if (!task.creator_id || task.notify_enabled === false) continue;
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
