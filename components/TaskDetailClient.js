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
import { taskStatus } from "@/lib/utils";
import { getOwnerToken, getMySignupIds, rememberMySignup, forgetMySignup } from "@/lib/ownerToken";
import { useScrollFadeRight } from "@/lib/useScrollFadeRight";

export default function TaskDetailClient() {
  const { id } = useParams();
  const router = useRouter();
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
    const { data: taskData } = await supabase.from("tasks").select("*").eq("id", id).single();
    setTask(taskData || null);

    const { data: signupData } = await supabase
      .from("signups")
      .select("*")
      .eq("task_id", id)
      .order("created_at", { ascending: true });
    setSignups(signupData || []);
    setMyIds(getMySignupIds());
    setLoading(false);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  const closed = task ? taskStatus(task).label === "已截止" : false;
  const full = task?.max_signups ? signups.length >= task.max_signups : false;
  const perCategoryQuantity = !!task?.quantity_unit && categories.length > 0;

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
    if (task.quantity_unit && task.categories?.length > 0 && categories.length === 0) {
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
          quantity: task.quantity_unit && !perCategoryQuantity ? quantity : undefined,
          category_quantities: perCategoryQuantity ? categoryQuantities : undefined,
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
      <div className="flex-1 flex flex-col">
        <TopBar title="找不到任務" />
        <FadeIn className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <TaskGoneIllustration />
          <p className="font-semibold text-gray-700 mt-4 mb-2">找不到這個任務</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            這個任務可能已經被主辦人刪除，
            <br />
            或分享連結已經失效。
          </p>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative min-w-0">
      <TopBar title={task.title} />

      <div className="px-6 pt-4">
        <TaskAnnouncement task={task} />
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-4 mb-2">
          <Users size={13} />
          {task.max_signups ? `${signups.length} / ${task.max_signups} 人已報名` : `${signups.length} 人已接龍`}
        </div>
      </div>

      <div ref={listRef} className="flex-1 px-6 pb-3 overflow-y-auto scroll-smooth min-w-0">
        <ThreadList
          signups={signups}
          myIds={myIds}
          categories={task.categories}
          quantityUnit={task.quantity_unit}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </div>

      {closed ? (
        <div className="px-6 pb-6 pt-2 text-center text-xs text-gray-400 border-t border-gray-100">
          此任務已截止，無法再接龍
        </div>
      ) : full ? (
        <div className="px-6 pb-6 pt-2 text-center text-xs text-gray-400 border-t border-gray-100">
          這個任務已經額滿，無法再接龍
        </div>
      ) : (
        <div className="px-6 pb-6 pt-3 border-t-2 border-emerald-100 bg-emerald-50/40 min-w-0 overflow-hidden">
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
              <div className="flex flex-col gap-2">
                {perCategoryQuantity
                  ? categories.map((c) => (
                      <QuantityStepper
                        key={c}
                        label={`${c}（${task.quantity_unit}）`}
                        value={categoryQuantities[c] ?? 1}
                        onChange={(v) => setCategoryQuantities((prev) => ({ ...prev, [c]: v }))}
                      />
                    ))
                  : (
                      <QuantityStepper
                        label={`數量（${task.quantity_unit}）`}
                        value={quantity}
                        onChange={setQuantity}
                      />
                    )}
              </div>
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
    </div>
  );
}
