"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "relay-task-mode-tutorial-seen";

const tutorials = {
  general: {
    title: "一般報名教學",
    subtitle: "適合聚餐、旅遊、課程、團購與活動報名",
    steps: [
      ["1", "建立任務", "填寫標題、日期、簡介與需要的分類。"],
      ["2", "分享到 LINE", "建立完成後，把任務卡片或連結分享到群組。"],
      ["3", "參加者完成報名", "參加者輸入姓名與資料，不需要登入即可報名。"],
      ["4", "主辦人管理名單", "查看、統計、下載名單，活動結束後再完成任務。"],
    ],
  },
  queue: {
    title: "現場排隊教學",
    subtitle: "適合候位、按摩、美容、美甲與現場服務",
    steps: [
      ["1", "建立排隊任務", "填寫標題、排隊期間、簡介與現場備註。"],
      ["2", "分享連結或 QR Code", "讓現場客人掃描後直接加入排隊。"],
      ["3", "客人查看順位", "加入後會看到目前順位與前方等待人數。"],
      ["4", "主辦人依序完成", "點擊完成目前第一位，後方名單會自動往前遞補。"],
    ],
  },
};

function normalize(value = "") {
  return String(value).replace(/\s+/g, "").trim();
}

function findLeaf(text) {
  const wanted = normalize(text);
  return Array.from(document.querySelectorAll("body *")).find((element) => {
    if (!(element instanceof HTMLElement)) return false;
    if (normalize(element.textContent) !== wanted) return false;
    return !Array.from(element.children).some((child) => normalize(child.textContent) === wanted);
  });
}

function findSection(element, requiredTexts = []) {
  let current = element?.parentElement;
  for (let depth = 0; current instanceof HTMLElement && depth < 7; depth += 1) {
    const text = normalize(current.textContent);
    if (requiredTexts.every((item) => text.includes(normalize(item)))) return current;
    current = current.parentElement;
  }
  return null;
}

function modeHelpHtml() {
  return `
    <div class="task-mode-help-card">
      <div class="task-mode-help-title">📖 不知道怎麼選？</div>
      <div class="task-mode-help-grid">
        <button type="button" data-task-tutorial="general" class="task-mode-help-option">
          <span class="task-mode-help-name">一般報名</span>
          <span class="task-mode-help-copy">統計名單、活動報名、團購與課程</span>
          <span class="task-mode-help-link">▶ 查看教學</span>
        </button>
        <button type="button" data-task-tutorial="queue" class="task-mode-help-option">
          <span class="task-mode-help-name">現場排隊</span>
          <span class="task-mode-help-copy">即時順位、候位與現場服務</span>
          <span class="task-mode-help-link">▶ 查看教學</span>
        </button>
      </div>
      <p class="task-mode-help-tip">💡 需要「統計名單」選一般報名；需要「即時順位」選現場排隊。</p>
    </div>`;
}

function ensureStyles() {
  if (document.getElementById("task-mode-tutorial-styles")) return;
  const style = document.createElement("style");
  style.id = "task-mode-tutorial-styles";
  style.textContent = `
    .task-mode-help-card{margin-top:14px;padding:14px;border:1px solid #d9f1e5;border-radius:22px;background:linear-gradient(135deg,#f2fff8,#fff);box-shadow:0 8px 24px rgba(22,148,106,.06)}
    .task-mode-help-title{font-size:14px;font-weight:800;color:#256b55;margin-bottom:10px}
    .task-mode-help-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .task-mode-help-option{display:flex;flex-direction:column;align-items:flex-start;text-align:left;min-width:0;padding:12px;border:1px solid #dfeee7;border-radius:17px;background:#fff}
    .task-mode-help-name{font-size:13px;font-weight:800;color:#174c3d}
    .task-mode-help-copy{font-size:11px;line-height:1.55;color:#718079;margin-top:4px}
    .task-mode-help-link{font-size:11px;font-weight:800;color:#16946a;margin-top:8px}
    .task-mode-help-tip{font-size:11px;line-height:1.55;color:#718079;margin-top:10px}
    @media(max-width:350px){.task-mode-help-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

export default function TaskModeTutorial() {
  const [type, setType] = useState(null);
  const [showFirst, setShowFirst] = useState(false);
  const tutorial = useMemo(() => (type ? tutorials[type] : null), [type]);

  useEffect(() => {
    const apply = () => {
      if (!window.location.pathname.startsWith("/create") || window.location.pathname.startsWith("/create/share")) return;
      ensureStyles();

      document.querySelectorAll("[data-task-advanced-help]").forEach((element) => element.remove());

      const general = findLeaf("一般報名");
      const queue = findLeaf("現場排隊");
      if (general && queue && !document.querySelector("[data-task-mode-help]")) {
        const section = findSection(general, ["一般報名", "現場排隊"]);
        if (section) {
          const holder = document.createElement("div");
          holder.dataset.taskModeHelp = "true";
          holder.innerHTML = modeHelpHtml();
          section.insertAdjacentElement("afterend", holder);
        }
      }

      document.querySelectorAll("[data-task-tutorial]").forEach((button) => {
        if (!(button instanceof HTMLElement) || button.dataset.bound === "true") return;
        button.dataset.bound = "true";
        button.addEventListener("click", () => setType(button.dataset.taskTutorial));
      });
    };

    apply();
    const observer = new MutationObserver(() => window.requestAnimationFrame(apply));
    observer.observe(document.body, { childList: true, subtree: true });

    try {
      if (window.location.pathname.startsWith("/create") && !localStorage.getItem(STORAGE_KEY)) setShowFirst(true);
    } catch {}

    return () => observer.disconnect();
  }, []);

  function dismissFirst(openTutorial = false) {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setShowFirst(false);
    if (openTutorial) setType("general");
  }

  return (
    <>
      {showFirst && (
        <div className="fixed inset-0 z-[2147482000] bg-black/45 flex items-center justify-center p-5" onClick={() => dismissFirst(false)}>
          <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="text-3xl mb-3">👋</div>
            <p className="text-lg font-bold text-gray-800">第一次使用？</p>
            <p className="text-sm text-gray-500 leading-relaxed mt-2">不知道要選一般報名還是現場排隊？先看快速教學，就能選對模式。</p>
            <button onClick={() => dismissFirst(true)} className="w-full mt-5 rounded-full bg-emerald-500 py-3 text-white font-bold">查看教學</button>
            <button onClick={() => dismissFirst(false)} className="w-full mt-2 rounded-full py-2.5 text-sm font-semibold text-gray-500">我知道了</button>
          </div>
        </div>
      )}

      {tutorial && (
        <div className="fixed inset-0 z-[2147483000] bg-black/60 flex items-end sm:items-center justify-center" onClick={() => setType(null)}>
          <div className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-[30px] sm:rounded-[30px] bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-lg font-bold text-gray-800">{tutorial.title}</p><p className="text-xs text-gray-500 mt-1">{tutorial.subtitle}</p></div>
              <button onClick={() => setType(null)} className="w-9 h-9 rounded-full bg-gray-100 text-gray-500">✕</button>
            </div>
            <div className="mt-5 space-y-3">
              {tutorial.steps.map(([number, title, copy]) => (
                <div key={number} className="flex gap-3 rounded-2xl bg-emerald-50/70 p-4">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">{number}</div>
                  <div><p className="text-sm font-bold text-gray-700">{title}</p><p className="text-xs leading-relaxed text-gray-500 mt-1">{copy}</p></div>
                </div>
              ))}
            </div>
            <button onClick={() => setType(type === "general" ? "queue" : "general")} className="w-full mt-5 rounded-full border border-emerald-200 bg-white py-3 text-sm font-bold text-emerald-600">查看{type === "general" ? "現場排隊" : "一般報名"}教學</button>
            <button onClick={() => setType(null)} className="w-full mt-2 rounded-full bg-emerald-500 py-3 text-sm font-bold text-white">看完了</button>
          </div>
        </div>
      )}
    </>
  );
}
