"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, Users, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import TaskAnnouncement from "@/components/TaskAnnouncement";
import ThreadList from "@/components/ThreadList";
import LoadingBubble from "@/components/LoadingBubble";
import TaskGoneIllustration from "@/components/TaskGoneIllustration";
import FadeIn from "@/components/FadeIn";
import Toast from "@/components/Toast";
import QuantityStepper from "@/components/QuantityStepper";
import ConfettiSuccess from "@/components/ConfettiSuccess";
import { supabase } from "@/lib/supabaseClient";
import { taskStatus, isHeadcountUnit, isQueueTask as isQueueTaskConfig } from "@/lib/utils";
import { getOwnerToken, getMySignupIds, rememberMySignup, forgetMySignup } from "@/lib/ownerToken";
import { useScrollFadeRight } from "@/lib/useScrollFadeRight";

export default function TaskDetailClient() {
  const { id } = useParams();
  const router = useRouter();
  const [viewOnly, setViewOnly] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "view"
  );
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [signups, setSignups] = useState([]);
  const [myIds, setMyIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [names, setNames] = useState([""]);
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [categoryQuantities, setCategoryQuantities] = useState({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [toast, setToast] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownIntervalRef = useRef(null);
  const listRef = useRef(null);
  const formSectionRef = useRef(null);
  const prevViewOnlyRef = useRef(viewOnly);
  const nameInputRef = useRef(null);
  const [catScrollRef, catSentinelRef, catCanScrollRight] = useScrollFadeRight(!loading && task?.categories?.length > 0);

  useEffect(() => {
    if (prevViewOnlyRef.current && !viewOnly) {
      requestAnimationFrame(() => {
        formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    prevViewOnlyRef.current = viewOnly;
  }, [viewOnly]);

  function startCooldown(seconds) {
    setCooldown(seconds);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function playSuccess(message) {
    setShowConfetti(true);
    showToast(message);
    setTimeout(() => setShowConfetti(false), 1700);
  }

  async function refreshSignups() {
    if (!id) return;
    const { data: signupData } = await supabase
      .from("signups")
      .select("*")
      .eq("task_id", id)
      .order("created_at", { ascending: true });
    setSignups(signupData || []);
    setMyIds(getMySignupIds());
  }

  async function load() {
    setLoading(true);
    const startedAt = Date.now();
    const { data: taskData } = await supabase.from("tasks").select("*").eq("id", id).single();
    setTask(taskData || null);

    await refreshSignups();

    const MIN_TRANSITION_MS = 500;
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_TRANSITION_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_TRANSITION_MS - elapsed));
    }

    setLoading(false);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  const closed = task ? taskStatus(task).label === "已截止" : false;
  const queueFromUrl = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("queue") === "1";
  const isQueueTask = !!task && (isQueueTaskConfig(task) || queueFromUrl);
  const headcountMode = isHeadcountUnit(task?.quantity_unit);
  const waitingSignups = signups.filter((s) => !s.checked_in);
  const completedSignups = signups.filter((s) => s.checked_in);
  const countableSignups = isQueueTask ? waitingSignups : signups;
  const totalHeadcount = headcountMode
    ? countableSignups.reduce((sum, s) => sum + (s.quantity ?? 1), 0)
    : countableSignups.length;
  const full = task?.max_signups ? totalHeadcount >= task.max_signups : false;
  const allowMulti = task ? !isQueueTask && (!task.categories || task.categories.length === 0) && !task.quantity_unit : false;
  const filledNames = names.map((n) => n.trim()).filter(Boolean);
  const isMultiActive = allowMulti && filledNames.length >= 2;
  const taskHasCategories = !isQueueTask && task?.categories?.length > 0;
  const usesPerCategoryQuantity = !isQueueTask && !!task?.quantity_unit && taskHasCategories;
  const queueDisplaySignups = isQueueTask ? [...waitingSignups, ...completedSignups] : signups;
  const mySignups = signups.filter((s) => myIds.includes(s.id));
  const myWaitingSignup = mySignups.find((s) => !s.checked_in);
  const myQueueNumber = myWaitingSignup ? waitingSignups.findIndex((s) => s.id === myWaitingSignup.id) + 1 : 0;
  const peopleAhead = myQueueNumber > 0 ? myQueueNumber - 1 : 0;
  const myAllCompleted = isQueueTask && mySignups.length > 0 && mySignups.every((s) => s.checked_in);

  useEffect(() => {
    if (!id || !isQueueTask) return;
    const timer = setInterval(() => {
      refreshSignups();
    }, 5000);
    return () => clearInterval(timer);
  }, [id, isQueueTask]);

  function toggleCategory(c) {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
    if (categoryError) setCategoryError("");
    setCategoryQuantities((prev) => {
      if (prev[c] != null) {
        const next = { ...prev };
        delete next[c];
        return next;
      }
      return { ...prev, [c]: 1 };
    });
  }

  async function handleSend() {
    if (!task) return;
    if (allowMulti) {
      if (!names[0] || !names[0].trim()) {
        setError("請先填寫您的姓名！");
        nameInputRef.current?.focus();
        return;
      }
    } else if (!name.trim()) {
      setError("請先填寫您的姓名！");
      nameInputRef.current?.focus();
      return;
    }
    if (!isQueueTask && task.quantity_unit && taskHasCategories && categories.length === 0) {
      setCategoryError("請至少選擇一個分類");
      return;
    }
    setSending(true);
    setError("");
    setCategoryError("");
    try {
      const res = await fetch("/api/signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: task.id,
          categories: !isQueueTask && task.categories?.length > 0 ? categories : [],
          name: allowMulti ? names[0].trim() : name.trim(),
          names: allowMulti && filledNames.length >= 2 ? filledNames : undefined,
          note: isQueueTask || isMultiActive ? "" : note.trim(),
          quantity: !isQueueTask && task.quantity_unit && !usesPerCategoryQuantity ? quantity : undefined,
          category_quantities: !isQueueTask && usesPerCategoryQuantity ? categoryQuantities : undefined,
          owner_token: getOwnerToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.cooldown_seconds) startCooldown(data.cooldown_seconds);
        throw new Error(data.error);
      }
      const created = data.signups || (data.signup ? [data.signup] : []);
      created.forEach((sg) => sg?.id && rememberMySignup(sg.id));
      setMyIds(getMySignupIds());
      setName("");
      setNames([""]);
      setNote("");
      setQuantity(1);
      setCategoryQuantities({});
      setCategories([]);
      playSuccess(isQueueTask ? "已加入排隊！" : data.count && data.count > 1 ? `這次共完成 ${data.count} 位的報名！` : "已成功接龍！");
      startCooldown(30);
      await refreshSignups();
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch (e) {
      setError(e.message || "送出失敗");
    }
    setSending(false);
  }

  async function handleUpdate(signupId, patch) {
    const res = await fetch(`/api/signups/${signupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...patch, owner_token: getOwnerToken() }),
    });
    const data = await res.json();
    if (res.ok) {
      setSignups((prev) => prev.map((s) => (s.id === signupId ? data.signup : s)));
      showToast("已更新");
    }
  }

  async function handleDelete(signupId) {
    const res = await fetch(`/api/signups/${signupId}?owner_token=${encodeURIComponent(getOwnerToken())}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSignups((prev) => prev.filter((s) => s.id !== signupId));
      forgetMySignup(signupId);
      setMyIds(getMySignupIds());
      showToast("已刪除");
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="載入中" />
        <div className="flex-1 flex items-center justify-center">
          <LoadingBubble />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <FadeIn className="flex-1 flex flex-col">
        <TopBar title="找不到任務" />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <TaskGoneIllustration />
          <p className="font-semibold text-gray-700 mt-4 mb-2">找不到這個任務</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            這個任務可能已經被主辦人刪除，
            <br />
            或分享連結已經失效。
          </p>
        </div>
      </FadeIn>
    );
  }

  return (
    <>
    <FadeIn className="flex-1 flex flex-col relative min-w-0">
      <TopBar title={task.title} />

      <div className="px-6 pt-4">
        <TaskAnnouncement task={task} full={full} />
        {task.max_signups ? (
          <div className="pl-11 mt-3 mb-4">
            <div className="flex items-center px-0.5">
              <Users size={15} className={`shrink-0 mr-2.5 ${full ? "text-rose-500" : "text-emerald-500"}`} />
              <span className={`text-xs font-semibold shrink-0 mr-3.5 ${full ? "text-rose-500" : "text-emerald-500"}`}>
                {totalHeadcount} / {task.max_signups} 人{full ? " · 已額滿" : ""}
              </span>
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${full ? "bg-rose-100" : "bg-emerald-100"}`}>
                <div
                  className={`h-full rounded-full ${full ? "bg-rose-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, (totalHeadcount / task.max_signups) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-4 mb-2 pl-11">
            <Users size={13} />
            {isQueueTask ? `${waitingSignups.length} 人等待中` : `${totalHeadcount} 人已接龍`}
          </div>
        )}

        {isQueueTask && (
          <div className={`mt-3 mb-3 overflow-hidden rounded-[28px] border shadow-sm ${myAllCompleted ? "border-emerald-100 bg-emerald-50" : myWaitingSignup ? "border-sky-100 bg-sky-50" : "border-emerald-100 bg-emerald-50/70"}`}>
            {myAllCompleted ? (
              <div className="px-5 py-5 text-center">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-200">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-3xl font-black tracking-tight text-emerald-700">已完成</p>
                <p className="text-sm font-semibold text-emerald-800 mt-2">主辦人已完成此筆排隊處理。</p>
                <p className="text-xs text-emerald-700/70 mt-1 leading-relaxed">謝謝您的耐心等待。</p>
              </div>
            ) : myWaitingSignup ? (
              <div className="px-5 py-5 text-center bg-gradient-to-br from-sky-50 via-white to-emerald-50">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center text-xl font-black shadow-sm shadow-sky-200">
                  {myQueueNumber}
                </div>
                <p className="text-[12px] font-bold tracking-wider text-sky-600 mb-1">目前等待順位</p>
                <p className="text-4xl font-black tracking-tight text-sky-700 leading-tight">第 {myQueueNumber} 位</p>
                <p className="text-base font-bold text-gray-700 mt-3">你前面還有 {peopleAhead} 位，請稍候。</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white/80 border border-sky-100 px-3 py-2">
                    <p className="text-[11px] text-gray-400 font-semibold">等待中</p>
                    <p className="text-2xl font-black text-sky-700">{waitingSignups.length}<span className="text-sm ml-1">位</span></p>
                  </div>
                  <div className="rounded-2xl bg-white/80 border border-emerald-100 px-3 py-2 flex flex-col items-center justify-center">
                    <span className="relative flex h-3 w-3 mb-2" aria-hidden="true">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                    </span>
                    <p className="text-sm font-bold text-emerald-700">即時更新中</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-5 py-5 text-center">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-200">
                  <Users size={23} />
                </div>
                <p className="text-[12px] font-bold tracking-wider text-emerald-600 mb-1">目前等待中</p>
                <p className="text-4xl font-black tracking-tight text-emerald-700 leading-tight">{waitingSignups.length}<span className="text-xl ml-1">位</span></p>
                <p className="text-xs text-emerald-700/70 mt-3 leading-relaxed">加入排隊後，會顯示你的等待順位。</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={listRef} className="flex-1 px-6 pb-3 overflow-y-auto scroll-smooth min-w-0">
        <ThreadList
          signups={queueDisplaySignups}
          myIds={myIds}
          categories={task.categories}
          quantityUnit={task.quantity_unit}
          nameOnly={viewOnly}
          closed={closed}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          queueMode={isQueueTask}
        />
      </div>

      {closed ? (
        <div ref={formSectionRef} className="px-6 pb-6 pt-2 text-center text-xs text-gray-400 border-t border-gray-100">
          此任務已截止，無法再接龍
        </div>
      ) : full ? (
        <div ref={formSectionRef} className="px-6 pb-6 pt-2 text-center text-xs text-gray-400 border-t border-gray-100">
          這個任務已經額滿，無法再接龍
        </div>
      ) : viewOnly ? (
        <div ref={formSectionRef} className="px-6 pb-6 pt-3 border-t border-gray-100">
          <button
            onClick={() => setViewOnly(false)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-3.5 font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition"
          >
            <Send size={18} />
            {isQueueTask ? "我要排隊" : "我要報名"}
          </button>
        </div>
      ) : (
        <div ref={formSectionRef} className="px-6 pb-6 pt-3 border-t-2 border-emerald-100 bg-emerald-50/40 min-w-0 overflow-hidden">
          {!isQueueTask && task.categories?.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-emerald-700 mb-1.5 px-0.5">👉 選擇您要報名的類別（可複選）</p>
              <div className={`relative -mx-1 ${categoryError ? "ring-1 ring-rose-300 rounded-xl" : ""}`}>
                <div ref={catScrollRef} className="flex gap-1.5 overflow-x-auto pb-2 mb-1 px-1">
                  {task.categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleCategory(c)}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
                        categories.includes(c) ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-500 border-gray-200"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  <span ref={catSentinelRef} aria-hidden="true" className="shrink-0 w-px h-1" />
                </div>
                {catCanScrollRight && (
                  <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-10 flex items-center justify-end bg-gradient-to-l from-emerald-50 to-transparent">
                    <ChevronRight size={14} className="text-emerald-400" />
                  </div>
                )}
              </div>
              {categoryError && (
                <p className="text-xs text-rose-500 flex items-center gap-1 px-0.5 mb-1">
                  <AlertCircle size={12} className="shrink-0" /> {categoryError}
                </p>
              )}
            </>
          )}
          <div className="flex flex-col gap-2">
            {allowMulti ? (
              <>
                {names.map((nm, i) => (
                  <input
                    key={i}
                    ref={i === 0 ? nameInputRef : undefined}
                    value={nm}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNames((prev) => {
                        const next = [...prev];
                        next[i] = v;
                        if (i === next.length - 1 && v.trim()) next.push("");
                        while (next.length > 1 && next[next.length - 1] === "" && next[next.length - 2] === "") {
                          next.pop();
                        }
                        return next;
                      });
                      if (error) setError("");
                    }}
                    placeholder={i === 0 ? "你的姓名" : "幫別人報名（選填）"}
                    className={`w-full border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
                      error && i === 0 ? "border-rose-300 focus:ring-rose-200" : "border-gray-200 focus:ring-emerald-300"
                    }`}
                  />
                ))}
                {isMultiActive && (
                  <p className="text-[11px] text-emerald-600 px-2 -mt-0.5">
                    一次幫 {filledNames.length} 位報名
                  </p>
                )}
              </>
            ) : (
              <input
                ref={nameInputRef}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder={isQueueTask ? "你的姓名（現場排隊限本人）" : "你的姓名"}
                className={`w-full border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
                  error ? "border-rose-300 focus:ring-rose-200" : "border-gray-200 focus:ring-emerald-300"
                }`}
              />
            )}
            {isQueueTask && (
              <p className="text-[11px] text-emerald-600 px-2 -mt-0.5">現場排隊僅限本人報名，不能幫別人報名。</p>
            )}
            {error && (
              <p className="text-xs text-rose-500 flex items-center gap-1 px-2 -mt-1">
                <AlertCircle size={12} className="shrink-0" /> {error}
              </p>
            )}
            {!isQueueTask && task.quantity_unit && (
              usesPerCategoryQuantity ? (
                categories.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {categories.map((c) => (
                      <QuantityStepper
                        key={c}
                        label={`${c}（${task.quantity_unit}）`}
                        value={categoryQuantities[c] ?? 1}
                        onChange={(v) => setCategoryQuantities((prev) => ({ ...prev, [c]: v }))}
                      />
                    ))}
                  </div>
                )
              ) : (
                <QuantityStepper
                  label={`數量（${task.quantity_unit}）`}
                  value={quantity}
                  onChange={setQuantity}
                />
              )
            )}
            {!isQueueTask && (
              <input
                value={isMultiActive ? "" : note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isMultiActive ? "幫多人報名時暫不支援備註" : "備註（選填）"}
                disabled={isMultiActive}
                className={`w-full border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition ${
                  isMultiActive ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "border-gray-200"
                }`}
              />
            )}
            <button
              onClick={handleSend}
              disabled={sending || cooldown > 0}
              className="w-full bg-emerald-500 disabled:opacity-70 text-white rounded-full py-3.5 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-md shadow-emerald-200 transition"
            >
              {sending ? (
                <>
                  {isQueueTask ? "排隊中" : "報名中"}
                  <span className="flex gap-1 ml-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                  </span>
                </>
              ) : cooldown > 0 ? (
                <>
                  {cooldown} 秒後可再次{isQueueTask ? "排隊" : "報名"}
                  <span className="flex gap-1 ml-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                  </span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  {isQueueTask ? "加入排隊" : "送出報名"}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </FadeIn>

    <ConfettiSuccess show={showConfetti} message={isQueueTask ? "已加入排隊！" : "報名成功！"} />

    {toast && (
      <Toast className="bottom-28">
        <div className="bg-rose-500 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
          <CheckCircle2 size={16} className="text-emerald-200" />
          {toast}
        </div>
      </Toast>
    )}
    </>
  );
}
