"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Pencil,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import TaskAnnouncement from "@/components/TaskAnnouncement";
import FadeIn from "@/components/FadeIn";
import Toast from "@/components/Toast";
import ConfettiSuccess from "@/components/ConfettiSuccess";
import { useLanguage } from "@/lib/useLanguage";
import { queueWaitDuration } from "@/lib/queueWaitDuration";
import { taskStatus } from "@/lib/utils";
import {
  forgetMySignup,
  getMySignupIds,
  getOwnerToken,
  rememberMySignup,
} from "@/lib/ownerToken";

const EMPTY_STATUS = {
  waiting_count: 0,
  completed_count: 0,
  queue_number: 0,
  people_ahead: 0,
  my_signups: [],
};

export default function QueueTaskDetailClient({ initialTask }) {
  const searchParams = useSearchParams();
  const task = initialTask;
  const language = useLanguage();
  const t = (zh, en) => language === "en" ? en : zh;
  const [status, setStatus] = useState(EMPTY_STATUS);
  const [hasStatus, setHasStatus] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const requestVersion = useRef(0);
  const [loading, setLoading] = useState(true);
  const [viewOnly, setViewOnly] = useState(() => searchParams.get("mode") === "view");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const formRef = useRef(null);
  const nameRef = useRef(null);

  const myWaitingSignup = useMemo(
    () => status.my_signups.find((signup) => !signup.checked_in) || null,
    [status.my_signups]
  );
  const myCompletedSignups = useMemo(
    () => status.my_signups.filter((signup) => signup.checked_in),
    [status.my_signups]
  );
  const closed = taskStatus(task).label === "已截止";
  const notStarted = taskStatus(task).label === "尚未開始";
  const full = task.max_signups ? status.waiting_count >= task.max_signups : false;

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function refreshStatus({ quiet = false } = {}) {
    const version = ++requestVersion.current;
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/queue-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          task_id: task.id,
          owner_token: getOwnerToken(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("讀取排隊狀態失敗", "Unable to load queue status"));
      if (version !== requestVersion.current) return;
      setStatus({ ...EMPTY_STATUS, ...data });
      setHasStatus(true);
      setSyncError(false);
    } catch (requestError) {
      if (version === requestVersion.current) setSyncError(true);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  useEffect(() => {
    setHasStatus(false);
    setStatus(EMPTY_STATUS);
    setSyncError(false);
    refreshStatus();
    const timer = window.setInterval(() => refreshStatus({ quiet: true }), 5000);
    return () => { ++requestVersion.current; window.clearInterval(timer); };
  }, [task.id]);

  useEffect(() => {
    if (!myWaitingSignup) {
      setEditingName(false);
      setShowCancelConfirm(false);
    }
  }, [myWaitingSignup?.id]);

  async function handleJoin() {
    if (sending || !hasStatus || syncError || notStarted || closed) return;
    if (!name.trim()) {
      setError(t("請先填寫您的姓名！", "Please enter your name."));
      nameRef.current?.focus();
      return;
    }
    if (myWaitingSignup) {
      setError(t("你目前已在排隊中，完成後才能重新加入排隊", "You are already in the queue. You can rejoin after completion."));
      return;
    }

    ++requestVersion.current;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: task.id,
          name: name.trim(),
          categories: [],
          note: "",
          owner_token: getOwnerToken(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("加入排隊失敗", "Unable to join the queue"));

      if (data.signup?.id) rememberMySignup(data.signup.id);
      setName("");
      setShowConfetti(true);
      window.setTimeout(() => setShowConfetti(false), 1700);
      showToast(t("已加入排隊！", "Joined the queue!"));
      await refreshStatus({ quiet: true });
    } catch (joinError) {
      setError(joinError.message || t("加入排隊失敗", "Unable to join the queue"));
    } finally {
      setSending(false);
    }
  }

  function beginNameEdit() {
    if (!myWaitingSignup) return;
    setNameDraft(myWaitingSignup.name || "");
    setEditingName(true);
  }

  async function saveName() {
    const nextName = nameDraft.trim();
    if (!myWaitingSignup || !nextName) {
      showToast(t("請輸入姓名", "Please enter your name"));
      return;
    }

    ++requestVersion.current;
    setActionBusy(true);
    try {
      const response = await fetch(`/api/signups/${myWaitingSignup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nextName,
          note: "",
          categories: [],
          owner_token: getOwnerToken(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("姓名更新失敗", "Unable to update your name"));
      setEditingName(false);
      showToast(t("姓名已更新", "Name updated"));
      await refreshStatus({ quiet: true });
    } catch (updateError) {
      showToast(updateError.message || t("姓名更新失敗", "Unable to update your name"));
    } finally {
      setActionBusy(false);
    }
  }

  async function cancelQueue() {
    if (!myWaitingSignup) return;
    ++requestVersion.current;
    setActionBusy(true);
    try {
      const response = await fetch(
        `/api/signups/${myWaitingSignup.id}?owner_token=${encodeURIComponent(getOwnerToken())}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("取消排隊失敗", "Unable to leave the queue"));
      forgetMySignup(myWaitingSignup.id);
      setShowCancelConfirm(false);
      setEditingName(false);
      showToast(t("已取消排隊", "Left the queue"));
      await refreshStatus({ quiet: true });
    } catch (cancelError) {
      showToast(cancelError.message || t("取消排隊失敗", "Unable to leave the queue"));
    } finally {
      setActionBusy(false);
    }
  }

  function openJoinForm() {
    setViewOnly(false);
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div data-native-queue="true" data-no-auto-i18n="true" className="flex flex-1 flex-col">
      <FadeIn className="flex-1 flex flex-col relative min-w-0">
        <TopBar title={task.title} />

        <div className="px-6 pt-4">
          <TaskAnnouncement task={task} full={full} />

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <Users size={17} />
              <span className="text-sm font-bold">{hasStatus ? <>{language === "en" ? `${status.waiting_count} waiting` : `目前 ${status.waiting_count} 位等待中`}</> : <span data-no-auto-i18n="true">{loading ? t("正在同步排隊狀態…", "Loading queue status…") : t("無法讀取排隊狀態", "Unable to load queue status")}</span>}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700/65">
              <ShieldCheck size={14} /> {t("名單已隱私保護", "Your details are private")}
            </div>
          </div>

          {syncError && <div data-no-auto-i18n="true" role="alert" className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
            <p>{hasStatus ? t("尚未同步，以下為上次取得的狀態", "Not synced. Showing the last available status.") : t("無法讀取排隊狀態，請重試", "Unable to load queue status. Please retry.")}</p>
            <button type="button" onClick={() => refreshStatus()} className="mt-2 font-bold underline">{t("重試", "Retry")}</button>
          </div>}
          <div className={`mt-3 overflow-hidden rounded-[28px] border shadow-sm ${
            myWaitingSignup
              ? "border-sky-100 bg-sky-50"
              : myCompletedSignups.length > 0
              ? "border-emerald-100 bg-emerald-50"
              : "border-emerald-100 bg-emerald-50/70"
          }`}>
            {loading ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">{t("正在同步排隊狀態…", "Loading queue status…")}</div>
            ) : !hasStatus ? (
              <p data-no-auto-i18n="true" className="px-5 py-8 text-center text-sm text-gray-500">{t("請重試以取得目前排隊狀態", "Retry to load the current queue status")}</p>
            ) : myWaitingSignup ? (
              <div className="bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-5 py-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-xl font-black text-white shadow-sm shadow-sky-200">
                  {status.queue_number}
                </div>
                <p data-queue-status-label="true" className="mt-3 text-[12px] font-bold tracking-wider text-sky-600">{t("你的排隊狀態", "Your Queue Status")}</p>
                <p className="mt-1 text-2xl font-black text-gray-800">{myWaitingSignup.name}</p>
                <p data-queue-rank={status.queue_number} className="mt-1 text-4xl font-black tracking-tight text-sky-700">{language === "en" ? `Position ${status.queue_number}` : `第 ${status.queue_number} 位`}</p>
                <p className="mt-3 text-base font-bold text-gray-700">{language === "en" ? `${status.people_ahead} ahead of you` : `前面還有 ${status.people_ahead} 位`}</p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-sky-100 bg-white/85 px-3 py-2.5">
                    <p className="text-[11px] font-semibold text-gray-400">{t("現場等待中", "Currently Waiting")}</p>
                    <p className="text-2xl font-black text-sky-700">{status.waiting_count}<span className="ml-1 text-sm">{t("位", "")}</span></p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white/85 px-3 py-2.5">
                    <p className="text-[11px] font-semibold text-gray-400">{t("等待時間", "Time Waiting")}</p>
                    <p className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-emerald-700">
                      <Clock3 size={14} /> {queueWaitDuration(myWaitingSignup.created_at, language)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-gray-400">{t("順位會依現場處理情況即時更新", "Your position updates as the organizer serves the queue.")}</p>

                {editingName ? (
                  <div className="mt-4 rounded-2xl border border-sky-100 bg-white/95 p-3 text-left">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500">{t("更改自己的姓名", "Change your name")}</label>
                    <input
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      maxLength={60}
                      autoFocus
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingName(false)}
                        disabled={actionBusy}
                        className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-sm font-semibold text-gray-500"
                      >
                        {t("取消", "Cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={saveName}
                        disabled={actionBusy}
                        className="flex-1 rounded-xl bg-sky-500 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {actionBusy ? t("儲存中…", "Saving…") : t("儲存姓名", "Save Name")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-sky-100 pt-4">
                    <button
                      type="button"
                      onClick={beginNameEdit}
                      className="flex items-center justify-center gap-1.5 rounded-2xl border border-sky-200 bg-white py-2.5 text-sm font-semibold text-sky-700"
                    >
                      <Pencil size={15} /> {t("更改姓名", "Change Name")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      className="flex items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-white py-2.5 text-sm font-semibold text-rose-500"
                    >
                      <XCircle size={16} /> {t("取消排隊", "Leave Queue")}
                    </button>
                  </div>
                )}
              </div>
            ) : myCompletedSignups.length > 0 ? (
              <div className="px-5 py-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-200">
                  <CheckCircle2 size={24} />
                </div>
                <p className="mt-3 text-2xl font-black text-emerald-700">{t("已完成", "Completed")}</p>
                <p className="mt-2 text-sm font-semibold text-emerald-800">{t("主辦人已完成你的排隊處理。", "The organizer has completed your turn.")}</p>
                <p className="mt-1 text-xs text-emerald-700/70">{t("謝謝你的耐心等待。", "Thank you for your patience.")}</p>
              </div>
            ) : (
              <div className="px-5 py-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-200">
                  <UserRound size={23} />
                </div>
                <p className="mt-3 text-[12px] font-bold tracking-wider text-emerald-600">{t("目前等待中", "Currently Waiting")}</p>
                <p className="text-4xl font-black tracking-tight text-emerald-700">{status.waiting_count}<span className="ml-1 text-xl">{t("位", "")}</span></p>
                <p className="mt-3 text-xs leading-relaxed text-emerald-700/70">{t("加入後只會顯示你自己的姓名、順位與狀態。", "After joining, only your own name, position and status are shown.")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1" />

        <div ref={formRef} className="scroll-mt-24">
          {!hasStatus ? null : notStarted ? (
            <p data-no-auto-i18n="true" className="px-6 py-4 text-center text-sm text-gray-400">{t("此任務尚未開始", "This task has not started yet")}</p>
          ) : closed ? (
            <div className="border-t border-gray-100 px-6 pb-6 pt-3 text-center text-xs text-gray-400">{t("此排隊任務已截止", "This queue is closed")}</div>
          ) : myWaitingSignup ? null : full ? (
            <div className="border-t border-gray-100 px-6 pb-6 pt-3 text-center text-xs text-gray-400">{t("目前排隊人數已達上限", "This queue is full")}</div>
          ) : viewOnly ? (
            <div className="border-t border-gray-100 px-6 pb-6 pt-3">
              <button
                type="button"
                onClick={openJoinForm}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-3.5 font-semibold text-white shadow-md shadow-emerald-200 transition"
              >
                <Send size={18} /> {t("我要加入排隊", "Join Queue")}
              </button>
            </div>
          ) : (
            <div className="min-w-0 overflow-hidden border-t-2 border-emerald-100 bg-emerald-50/40 px-6 pb-6 pt-3">
              <input
                ref={nameRef}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (error) setError("");
                }}
                placeholder={t("你的姓名（現場排隊限本人）", "Your name (queue is for yourself only)")}
                className={`w-full rounded-full border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                  error ? "border-rose-300 focus:ring-rose-200" : "border-gray-200 focus:ring-emerald-300"
                }`}
              />
              <p className="mt-1.5 px-2 text-[11px] text-emerald-600">{t("一個瀏覽器在同一個任務中，只能保有一筆有效排隊。", "Each browser can have only one active entry in this queue.")}</p>
              {error && (
                <p className="mt-1 flex items-center gap-1 px-2 text-xs text-rose-500">
                  <AlertCircle size={12} /> {error}
                </p>
              )}
              <button
                type="button"
                onClick={handleJoin}
                disabled={sending || syncError || !hasStatus}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-3.5 font-semibold text-white shadow-md shadow-emerald-200 transition disabled:opacity-70"
              >
                {sending ? t("加入排隊中…", "Joining…") : <><Send size={18} /> {t("加入排隊", "Join Queue")}</>}
              </button>
            </div>
          )}
        </div>
      </FadeIn>

      <ConfettiSuccess show={showConfetti} message={t("已加入排隊！", "Joined the queue!")} />

      {showCancelConfirm && myWaitingSignup && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/40 px-6" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <XCircle size={25} />
            </div>
            <h3 className="mt-3 text-center text-lg font-bold text-gray-800">{t("確定要取消排隊嗎？", "Leave the queue?")}</h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">{t("取消後會失去目前順位，再次加入時會排到最後一位。", "You will lose your position. If you rejoin, you will go to the end of the queue.")}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                disabled={actionBusy}
                className="rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600"
              >
                {t("返回等待", "Keep Waiting")}
              </button>
              <button
                type="button"
                onClick={cancelQueue}
                disabled={actionBusy}
                className="rounded-2xl bg-rose-500 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {actionBusy ? t("取消中…", "Leaving…") : t("確定取消", "Leave Queue")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast className="bottom-28">
          <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">
            <CheckCircle2 size={16} /> {toast}
          </div>
        </Toast>
      )}
    </div>
  );
}
