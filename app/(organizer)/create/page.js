"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, X, AlertTriangle } from "lucide-react";
import AutoGrowTextarea from "@/components/AutoGrowTextarea";
import DatePickerField from "@/components/DatePickerField";
import OnboardingTour, {
  getOnboardingState,
  setOnboardingState,
} from "@/components/OnboardingTour";
import { useOrganizerProfile } from "@/lib/OrganizerContext";
import { chipClass, todayStr } from "@/lib/utils";

const fieldClass =
  "w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder:text-xs placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white";

export default function CreateTaskPage() {
  const router = useRouter();
  const profile = useOrganizerProfile();

  return (
    <TaskForm
      accessToken={profile.accessToken}
      onCreated={(id) => router.push(`/create/share/${id}`)}
      onLeave={() => router.push("/")}
    />
  );
}

function TaskForm({ accessToken, onCreated, onLeave }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [catInput, setCatInput] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [maxSignups, setMaxSignups] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const titleRef = useRef(null);

  // 首次操作教學導覽：本機沒有任何進度標記，代表第一次來到這個
  // 頁面，稍微等版面穩定後自動開始導覽。看完建立頁的步驟後標記
  // 為 "pending-share"，等任務建立完成、跳到分享頁時接續最後一步。
  const [showTour, setShowTour] = useState(false);
  useEffect(() => {
    if (getOnboardingState()) return;
    const t = setTimeout(() => setShowTour(true), 500);
    return () => clearTimeout(t);
  }, []);

  const tourSteps = [
    {
      target: "title",
      title: "填寫任務標題",
      text: "先幫這個任務取個名字，例如「週日爬山健行」「週五團購水果」。標題是唯一必填的欄位。",
    },
    {
      target: "description",
      title: "填寫簡介（選填）",
      text: "簡單說明這個任務在做什麼，例如集合時間地點、團購截止日，報名的人在報名頁就看得到。",
    },
    {
      target: "categories",
      title: "設定分類（選填）",
      text: "可以加入幾個分類讓報名的人勾選，例如帶小孩、帶朋友，或雞排、珍奶等品項，適合分組或團購的場景。",
    },
    {
      target: "dates",
      title: "選擇日期",
      text: "設定任務的起訖日期，點一下就會打開日期選擇器。",
    },
    {
      target: "max",
      title: "報名人數上限（選填）",
      text: "設定最多幾人可以報名，額滿後就無法再報名。不填代表不限人數。",
    },
    {
      target: "unit",
      title: "數量單位（選填）",
      text: "如果報名需要填數量（例如團購幾份），在這裡填單位，像「份」「斤」「個」。填了之後，報名的人才會看到數量欄位。",
    },
    {
      target: "note",
      title: "備註（選填）",
      text: "其他想提醒大家的事項，例如集合地點、付款方式。",
    },
    {
      target: "save",
      title: "儲存任務",
      text: "全部填好後，按這顆按鈕建立任務。完成後會跳到分享頁，接續最後一步教學。",
    },
  ];

  const defaults = useRef({ start_date: todayStr(), end_date: todayStr() });

  const titleMissing = titleTouched && !title.trim();

  const dirty =
    title.trim() !== "" ||
    description.trim() !== "" ||
    categories.length > 0 ||
    note.trim() !== "" ||
    startDate !== defaults.current.start_date ||
    endDate !== defaults.current.end_date;

  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    window.history.pushState(null, "", window.location.href);
    function handlePopState() {
      window.history.pushState(null, "", window.location.href);
      setShowLeaveConfirm(true);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [dirty]);

  function handleBackClick() {
    if (dirty) setShowLeaveConfirm(true);
    else onLeave();
  }

  function addCategory() {
    const v = catInput.trim();
    if (v && !categories.includes(v)) setCategories([...categories, v]);
    setCatInput("");
  }
  function removeCategory(c) {
    setCategories(categories.filter((x) => x !== c));
  }

  async function handleSave() {
    if (!title.trim()) {
      setTitleTouched(true);
      titleRef.current?.focus();
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categories,
          start_date: startDate,
          end_date: endDate,
          max_signups: maxSignups,
          quantity_unit: quantityUnit,
          note: note.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data.task.id);
    } catch (e) {
      setError(e.message || "儲存失敗，請再試一次");
    }
    setSaving(false);
  }

  return (
    <div className="flex-1 flex flex-col relative min-w-0">
      <div className="flex-1 px-6 py-4 flex flex-col gap-5 overflow-y-auto">
        {error && <p className="text-xs text-rose-500">{error}</p>}
        <Field label="任務標題" required error={titleMissing ? "請填寫任務標題" : ""} tourId="title">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleTouched) setTitleTouched(false);
            }}
            onBlur={() => setTitleTouched(true)}
            placeholder="例如：週日爬山健行、週五團購水果"
            className={`${fieldClass} ${titleMissing ? "ring-2 ring-rose-300 bg-rose-50/60 focus:ring-rose-400" : ""}`}
          />
        </Field>

        <Field label="簡介" tourId="description">
          <AutoGrowTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="簡單說明這個任務在做什麼"
            minRows={2}
            className={fieldClass}
          />
        </Field>

        <Field label="分類（自訂，選填）" tourId="categories">
          <div className="flex gap-2">
            <input
              value={catInput}
              onChange={(e) => setCatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
              placeholder="例如：職位分類、組別分類、產品分類"
              className={`flex-1 ${fieldClass} py-2.5`}
            />
            <button
              onClick={addCategory}
              className="px-4 rounded-2xl bg-white border border-emerald-500 text-emerald-500 text-sm font-medium hover:bg-emerald-50 transition shrink-0"
            >
              新增
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5 px-0.5">輸入文字後，按「新增」或按 Enter 加入一個分類</p>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {categories.map((c) => (
                <span key={c} className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 ${chipClass(c)}`}>
                  {c}
                  <button onClick={() => removeCategory(c)}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
        </Field>

        <Field label="日期" tourId="dates">
          <div className="flex items-center gap-2">
            <DatePickerField
              value={startDate}
              onChange={setStartDate}
              className={`flex-1 ${fieldClass} py-2.5`}
              maxDate={endDate}
              rangeErrorMessage="起始日期不能晚於結束日期"
            />
            <span className="text-gray-300">~</span>
            <DatePickerField
              value={endDate}
              onChange={setEndDate}
              className={`flex-1 ${fieldClass} py-2.5`}
              minDate={startDate}
              rangeErrorMessage="結束日期不能早於起始日期"
            />
          </div>
        </Field>

        <Field label="報名人數上限（選填，不填代表不限人數）" tourId="max">
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={maxSignups}
            onChange={(e) => setMaxSignups(e.target.value)}
            placeholder="例如：20"
            className={fieldClass}
          />
        </Field>

        <Field label="數量單位（選填，例如：份、斤、個——填了報名的人才會看到數量欄位）" tourId="unit">
          <input
            value={quantityUnit}
            onChange={(e) => setQuantityUnit(e.target.value)}
            placeholder="例如：份"
            className={fieldClass}
          />
        </Field>

        <Field label="備註" tourId="note">
          <AutoGrowTextarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="其他提醒事項"
            minRows={3}
            className={fieldClass}
          />
        </Field>
      </div>

      <div className="px-6 pb-6 pt-2" data-tour="save">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-500 disabled:opacity-60 text-white rounded-full py-3 font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2 transition"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          儲存任務
        </button>
      </div>

      {showLeaveConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => setShowLeaveConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
              <AlertTriangle size={20} />
            </div>
            <p className="font-semibold text-gray-800 text-base mb-1">尚未儲存這個任務</p>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              離開後，目前填寫的內容不會被儲存，確定要離開嗎？
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
              >
                繼續填寫
              </button>
              <button
                onClick={() => {
                  setShowLeaveConfirm(false);
                  onLeave();
                }}
                className="flex-1 py-2.5 rounded-full bg-rose-500 text-white text-sm font-medium hover:bg-rose-600"
              >
                不儲存離開
              </button>
            </div>
          </div>
        </div>
      )}

      {showTour && (
        <OnboardingTour
          steps={tourSteps}
          finishLabel="知道了，開始填寫"
          onFinish={() => {
            setOnboardingState("pending-share");
            setShowTour(false);
          }}
          onSkip={() => {
            setOnboardingState("done");
            setShowTour(false);
          }}
        />
      )}
    </div>
  );
}

function Field({ label, children, required, error, tourId }) {
  return (
    <div data-tour={tourId || undefined}>
      <p className="text-xs text-gray-500 font-medium mb-1.5">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </p>
      {children}
      {error && <p className="text-xs text-rose-500 mt-1.5">{error}</p>}
    </div>
  );
}
