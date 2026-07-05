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
import QuantityStepper from "@/components/QuantityStepper";
import { supabase } from "@/lib/supabaseClient";
import { taskStatus, isHeadcountUnit } from "@/lib/utils";
import { getOwnerToken, getMySignupIds, rememberMySignup, forgetMySignup } from "@/lib/ownerToken";
import { useScrollFadeRight } from "@/lib/useScrollFadeRight";

export default function TaskDetailClient() {
  const { id } = useParams();
  const router = useRouter();
  // When someone taps "查看名單" on the share card (instead of "我要報名"),
  // they land here with the form hidden — just the task info and who's
  // already joined, no pressure to fill anything in until they choose to.
  // Read straight from window.location (rather than the useSearchParams
  // hook) so this component doesn't need a <Suspense> boundary wrapper.
  const [viewOnly, setViewOnly] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "view"
  );
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [signups, setSignups] = useState([]);
  const [myIds, setMyIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [categoryQuantities, setCategoryQuantities] = useState({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [toast, setToast] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownIntervalRef = useRef(null);
  const listRef = useRef(null);
  const formSectionRef = useRef(null);
  const prevViewOnlyRef = useRef(viewOnly);

  // When someone reveals the form from "查看名單" mode (viewOnly true ->
  // false), scroll it into view automatically — otherwise the form
  // appears below the fold and they'd have to notice it and scroll down
  // themselves.
  useEffect(() => {
    if (prevViewOnlyRef.current && !viewOnly) {
      requestAnimationFrame(() => {
        formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    prevViewOnlyRef.current = viewOnly;
  }, [viewOnly]);
  const nameInputRef = useRef(null);
  const [catScrollRef, catSentinelRef, catCanScrollRight] = useScrollFadeRight(!loading && task?.categories?.length > 0);

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

  async function load() {
    setLoading(true);
    const startedAt = Date.now();
    const { data: taskData } = await supabase.from("tasks").select("*").eq("id", id).single();
    setTask(taskData || null);

    const { data: signupData } = await supabase
      .from("signups")
      .select("*")
      .eq("task_id", id)
      .order("created_at", { ascending: true });
    setSignups(signupData || []);
    setMyIds(getMySignupIds());

    // Guarantee the transition screen is actually visible for a beat —
    // without this, a fast network response can resolve in a few tens of
    // milliseconds, making the loading state flash past unnoticed and the
    // final screen (found or not-found) feel like it just jump-cut in
    // rather than eased in after a proper transition.
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
  const headcountMode = isHeadcountUnit(task?.quantity_unit);
  const totalHeadcount = headcountMode
    ? signups.reduce((sum, s) => sum + (s.quantity ?? 1), 0)
    : signups.length;
  const full = task?.max_signups ? totalHeadcount >= task.max_signups : false;
  const taskHasCategories = task?.categories?.length > 0;
  // Per-category quantity mode is determined by whether the TASK itself
  // defines categories (not by whether the visitor has picked one yet).
  // That's what keeps the quantity field hidden entirely until a tag is
  // selected, instead of falling back to a generic "數量" field the
  // moment the page loads.
  const usesPerCategoryQuantity = !!task?.quantity_unit && taskHasCategories;

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
    if (!name.trim()) {
      setError("請先填寫您的姓名！");
      nameInputRef.current?.focus();
      return;
    }
    if (task.quantity_unit && taskHasCategories && categories.length === 0) {
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
          categories: task.categories?.length > 0 ? categories : [],
          name: name.trim(),
          note: note.trim(),
          quantity: task.quantity_unit && !usesPerCategoryQuantity ? quantity : undefined,
          category_quantities: usesPerCategoryQuantity ? categoryQuantities : undefined,
          owner_token: getOwnerToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.cooldown_seconds) startCooldown(data.cooldown_seconds);
        throw new Error(data.error);
      }
      rememberMySignup(data.signup.id);
      setMyIds(getMySignupIds());
      setName("");
      setNote("");
      setQuantity(1);
      setCategoryQuantities({});
      setCategories([]);
      showToast("已成功接龍！");
      startCooldown(30);
      // Re-fetch from the database instead of only patching local state, so
      // the list is always guaranteed to match what's actually saved —
      // this is what fixes the "first signup doesn't show until you leave
      // and re-open the page" issue.
      const { data: signupData } = await supabase
        .from("signups")
        .select("*")
        .eq("task_id", id)
        .order("created_at", { ascending: true });
      setSignups(signupData || []);
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
            {totalHeadcount} 人已接龍
          </div>
        )}
      </div>

      <div ref={listRef} className="flex-1 px-6 pb-3 overflow-y-auto scroll-smooth min-w-0">
        <ThreadList
          signups={signups}
          myIds={myIds}
          categories={task.categories}
          quantityUnit={task.quantity_unit}
          nameOnly={viewOnly}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
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
            我要報名
          </button>
        </div>
      ) : (
        <div ref={formSectionRef} className="px-6 pb-6 pt-3 border-t-2 border-emerald-100 bg-emerald-50/40 min-w-0 overflow-hidden">
          {task.categories?.length > 0 && (
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
            <input
              ref={nameInputRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="你的姓名"
              className={`w-full border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
                error ? "border-rose-300 focus:ring-rose-200" : "border-gray-200 focus:ring-emerald-300"
              }`}
            />
            {error && (
              <p className="text-xs text-rose-500 flex items-center gap-1 px-2 -mt-1">
                <AlertCircle size={12} className="shrink-0" /> {error}
              </p>
            )}
            {task.quantity_unit && (
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
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="備註（選填）"
              className="w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <button
              onClick={handleSend}
              disabled={sending || cooldown > 0}
              className="w-full bg-emerald-500 disabled:opacity-70 text-white rounded-full py-3.5 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-md shadow-emerald-200 transition"
            >
              {sending ? (
                <>
                  報名中
                  <span className="flex gap-1 ml-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                  </span>
                </>
              ) : cooldown > 0 ? (
                <>
                  {cooldown} 秒後可再次報名
                  <span className="flex gap-1 ml-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                  </span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  送出報名
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 whitespace-nowrap">
          <CheckCircle2 size={16} className="text-emerald-200" />
          {toast}
        </div>
      )}
    </FadeIn>
  );
}
