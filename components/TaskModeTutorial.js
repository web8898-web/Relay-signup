"use client";

import { useEffect, useMemo, useState } from "react";

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

function findInteractiveAncestor(element) {
  let current = element;
  for (let depth = 0; current instanceof HTMLElement && depth < 6; depth += 1) {
    if (current.matches("button,[role='button'],summary") || current.onclick) return current;
    current = current.parentElement;
  }
  return element instanceof HTMLElement ? element : null;
}

function findScrollParent(element) {
  let current = element?.parentElement;
  while (current instanceof HTMLElement) {
    const style = window.getComputedStyle(current);
    if ((style.overflowY === "auto" || style.overflowY === "scroll") && current.scrollHeight > current.clientHeight + 4) return current;
    current = current.parentElement;
  }
  return null;
}

function scrollAdvancedIntoComfortableView(anchor) {
  if (!(anchor instanceof HTMLElement)) return;
  const desiredTop = window.innerWidth <= 480 ? 218 : 150;
  const scrollParent = findScrollParent(anchor);
  if (scrollParent) {
    const parentRect = scrollParent.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const nextTop = scrollParent.scrollTop + anchorRect.top - parentRect.top - desiredTop;
    scrollParent.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
    return;
  }
  const nextTop = window.scrollY + anchor.getBoundingClientRect().top - desiredTop;
  window.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
}

function bindAdvancedAutoPosition(advanced, section) {
  if (!(advanced instanceof HTMLElement) || !(section instanceof HTMLElement)) return;
  const toggle = findInteractiveAncestor(advanced);
  if (!(toggle instanceof HTMLElement) || toggle.dataset.advancedAutoPositionBound === "true") return;
  toggle.dataset.advancedAutoPositionBound = "true";
  toggle.addEventListener("click", () => {
    const beforeHeight = section.getBoundingClientRect().height;
    [80, 180, 320, 520, 760].forEach((delay) => {
      window.setTimeout(() => {
        const expanded = section.getBoundingClientRect().height > beforeHeight + 20;
        if (expanded) scrollAdvancedIntoComfortableView(advanced);
      }, delay);
    });
  });
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
    .task-mode-help-option{display:flex;flex-direction:column;align-items:flex-start;text-align:left;min-width:0;padding:12px;border:1px solid #dfeee7;border-radius:17px;background:#fff;cursor:pointer;touch-action:manipulation;transform:translateZ(0);transition:transform 120ms ease,background-color 120ms ease,border-color 120ms ease,box-shadow 120ms ease}
    .task-mode-help-option:active,.task-mode-help-option.task-mode-help-pressed{transform:scale(.965) translateY(1px);background:#e9fbf2;border-color:#7ddbb6;box-shadow:inset 0 2px 7px rgba(22,148,106,.14)}
    .task-mode-help-name{font-size:13px;font-weight:800;color:#174c3d}
    .task-mode-help-copy{font-size:11px;line-height:1.55;color:#718079;margin-top:4px}
    .task-mode-help-link{font-size:11px;font-weight:800;color:#16946a;margin-top:8px}
    .task-mode-help-tip{width:100%;margin-top:10px;text-align:center;white-space:nowrap;font-size:clamp(8px,2.55vw,11px);line-height:1.45;letter-spacing:-.045em;color:#718079}
    @media(max-width:350px){.task-mode-help-grid{grid-template-columns:1fr}.task-mode-help-tip{font-size:8px;letter-spacing:-.06em}}

    .task-tutorial-title,.task-tutorial-subtitle,.task-tutorial-step-title,.task-tutorial-step-copy{display:block;white-space:nowrap;overflow:visible;text-overflow:clip}
    .task-tutorial-title{font-size:clamp(16px,4.7vw,18px);letter-spacing:-.035em}
    .task-tutorial-subtitle{font-size:clamp(10px,3.05vw,12px);letter-spacing:-.045em}
    .task-tutorial-step-content{min-width:0;flex:1;overflow:visible}
    .task-tutorial-step-title{font-size:clamp(12px,3.7vw,14px);letter-spacing:-.045em}
    .task-tutorial-step-copy{font-size:clamp(9px,2.9vw,12px);letter-spacing:-.055em;line-height:1.35}

    @keyframes taskTutorialBackdropIn{from{opacity:0}to{opacity:1}}
    @keyframes taskTutorialBackdropOut{from{opacity:1}to{opacity:0}}
    @keyframes taskTutorialSheetIn{from{transform:translate3d(0,100%,0);opacity:.96}to{transform:translate3d(0,0,0);opacity:1}}
    @keyframes taskTutorialSheetOut{from{transform:translate3d(0,0,0);opacity:1}to{transform:translate3d(0,100%,0);opacity:.96}}

    @keyframes flipOutForward{0%{transform:rotateX(0);opacity:1;filter:brightness(1)}55%{transform:rotateX(-44deg);opacity:.9;filter:brightness(.96)}100%{transform:rotateX(-90deg);opacity:0;filter:brightness(.88)}}
    @keyframes flipInForward{0%{transform:rotateX(90deg);opacity:0;filter:brightness(.88)}58%{transform:rotateX(16deg);opacity:.94;filter:brightness(.98)}82%{transform:rotateX(-3deg);opacity:1}100%{transform:rotateX(0);opacity:1;filter:brightness(1)}}
    @keyframes flipOutBackward{0%{transform:rotateX(0);opacity:1;filter:brightness(1)}55%{transform:rotateX(44deg);opacity:.9;filter:brightness(.96)}100%{transform:rotateX(90deg);opacity:0;filter:brightness(.88)}}
    @keyframes flipInBackward{0%{transform:rotateX(-90deg);opacity:0;filter:brightness(.88)}58%{transform:rotateX(-16deg);opacity:.94;filter:brightness(.98)}82%{transform:rotateX(3deg);opacity:1}100%{transform:rotateX(0);opacity:1;filter:brightness(1)}}

    .task-tutorial-backdrop-open{animation:taskTutorialBackdropIn 260ms ease-out both}
    .task-tutorial-backdrop-close{animation:taskTutorialBackdropOut 300ms ease-in both}
    .task-tutorial-sheet-open{animation:taskTutorialSheetIn 360ms cubic-bezier(.22,.8,.3,1) both}
    .task-tutorial-sheet-close{animation:taskTutorialSheetOut 320ms cubic-bezier(.4,0,.8,.2) both}

    .task-tutorial-flip-unit{position:relative;transform-style:preserve-3d;backface-visibility:hidden;transform-origin:50% 50%;will-change:transform,opacity,filter}
    .task-tutorial-flip-unit::after{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:linear-gradient(90deg,transparent,rgba(15,23,42,.11),transparent);opacity:0;pointer-events:none}
    .task-tutorial-flip-out-forward{animation:flipOutForward 210ms cubic-bezier(.55,.02,.8,.45) both}
    .task-tutorial-flip-in-forward{animation:flipInForward 320ms cubic-bezier(.18,.78,.26,1) both}
    .task-tutorial-flip-out-backward{animation:flipOutBackward 210ms cubic-bezier(.55,.02,.8,.45) both}
    .task-tutorial-flip-in-backward{animation:flipInBackward 320ms cubic-bezier(.18,.78,.26,1) both}
    .task-tutorial-flip-out-forward::after,.task-tutorial-flip-in-forward::after,.task-tutorial-flip-out-backward::after,.task-tutorial-flip-in-backward::after{opacity:1}

    @media(prefers-reduced-motion:reduce){
      .task-tutorial-backdrop-open,.task-tutorial-backdrop-close,.task-tutorial-sheet-open,.task-tutorial-sheet-close,.task-tutorial-flip-out-forward,.task-tutorial-flip-in-forward,.task-tutorial-flip-out-backward,.task-tutorial-flip-in-backward{animation-duration:1ms!important;animation-delay:0ms!important}
    }
  `;
  document.head.appendChild(style);
}

export default function TaskModeTutorial() {
  const [type, setType] = useState(null);
  const [closing, setClosing] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [swapPhase, setSwapPhase] = useState("idle");
  const [swapDirection, setSwapDirection] = useState("forward");
  const tutorial = useMemo(() => (type ? tutorials[type] : null), [type]);

  function openTutorial(nextType) {
    setClosing(false);
    setSwitching(false);
    setSwapPhase("idle");
    setType(nextType);
  }

  function switchTutorial() {
    if (!type || switching) return;
    const nextType = type === "general" ? "queue" : "general";
    const direction = nextType === "queue" ? "forward" : "backward";
    setSwitching(true);
    setSwapDirection(direction);
    setSwapPhase("out");
    window.setTimeout(() => {
      setType(nextType);
      setSwapPhase("in");
      window.setTimeout(() => {
        setSwapPhase("idle");
        setSwitching(false);
      }, 620);
    }, 300);
  }

  function closeTutorial() {
    if (!type || closing) return;
    setClosing(true);
    window.setTimeout(() => {
      setType(null);
      setClosing(false);
      setSwitching(false);
      setSwapPhase("idle");
    }, 320);
  }

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
      const advanced = findLeaf("進階設定");
      if (advanced) {
        const advancedSection = findSection(advanced, ["進階設定"]) || advanced.parentElement;
        if (advancedSection instanceof HTMLElement) bindAdvancedAutoPosition(advanced, advancedSection);
      }
      document.querySelectorAll("[data-task-tutorial]").forEach((button) => {
        if (!(button instanceof HTMLElement) || button.dataset.bound === "true") return;
        button.dataset.bound = "true";
        button.addEventListener("pointerdown", () => button.classList.add("task-mode-help-pressed"));
        const release = () => button.classList.remove("task-mode-help-pressed");
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("pointerleave", release);
        button.addEventListener("click", () => openTutorial(button.dataset.taskTutorial));
      });
    };
    apply();
    const observer = new MutationObserver(() => window.requestAnimationFrame(apply));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const phaseClass = swapPhase === "out"
    ? `task-tutorial-flip-out-${swapDirection}`
    : swapPhase === "in"
      ? `task-tutorial-flip-in-${swapDirection}`
      : "";

  const staggerStyle = (index) => ({
    animationDelay: swapPhase === "idle" ? "0ms" : `${index * 55}ms`,
  });

  return (
    <>
      {tutorial && (
        <div className={`fixed inset-0 z-[2147483000] bg-black/60 flex items-end sm:items-center justify-center ${closing ? "task-tutorial-backdrop-close" : "task-tutorial-backdrop-open"}`} onClick={closeTutorial}>
          <div className={`w-full max-w-md max-h-[88vh] overflow-y-auto overflow-x-hidden rounded-t-[30px] sm:rounded-[30px] bg-white p-6 shadow-2xl ${closing ? "task-tutorial-sheet-close" : "task-tutorial-sheet-open"}`} onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div className={`task-tutorial-flip-unit ${phaseClass}`} style={staggerStyle(0)}>
                <p className="task-tutorial-title font-bold text-gray-800">{tutorial.title}</p>
                <p className="task-tutorial-subtitle text-gray-500 mt-1">{tutorial.subtitle}</p>
              </div>
              <button onClick={closeTutorial} className="w-9 h-9 shrink-0 rounded-full bg-gray-100 text-gray-500">✕</button>
            </div>

            <div className="mt-5 space-y-3">
              {tutorial.steps.map(([number, title, copy], index) => (
                <div key={number} className={`task-tutorial-flip-unit flex items-center gap-3 rounded-2xl bg-emerald-50/70 p-4 ${phaseClass}`} style={staggerStyle(index + 1)}>
                  <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">{number}</div>
                  <div className="task-tutorial-step-content">
                    <p className="task-tutorial-step-title font-bold text-gray-700">{title}</p>
                    <p className="task-tutorial-step-copy text-gray-500 mt-1">{copy}</p>
                  </div>
                </div>
              ))}
            </div>

            <button disabled={switching} onClick={switchTutorial} className={`task-tutorial-flip-unit w-full mt-5 rounded-full border border-emerald-200 bg-white py-3 text-sm font-bold text-emerald-600 disabled:opacity-70 ${phaseClass}`} style={staggerStyle(5)}>
              查看{type === "general" ? "現場排隊" : "一般報名"}教學
            </button>
            <button onClick={closeTutorial} className="w-full mt-2 rounded-full bg-emerald-500 py-3 text-sm font-bold text-white">看完了</button>
          </div>
        </div>
      )}
    </>
  );
}
