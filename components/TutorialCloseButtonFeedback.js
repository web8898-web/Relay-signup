"use client";

import { useEffect } from "react";

const STYLE_ID = "tutorial-close-button-feedback-style";

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes tutorialCloseTapPulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(107,114,128,.18); }
      45% { transform: scale(.82) rotate(-7deg); background:#e5e7eb; color:#374151; box-shadow: 0 0 0 8px rgba(107,114,128,.10); }
      100% { transform: scale(1) rotate(0); box-shadow: 0 0 0 14px rgba(107,114,128,0); }
    }
    .tutorial-close-feedback {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: transform 140ms ease, background-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .tutorial-close-feedback:active,
    .tutorial-close-feedback.is-pressed {
      transform: scale(.84) rotate(-6deg);
      background:#e5e7eb !important;
      color:#374151 !important;
      box-shadow: 0 0 0 7px rgba(107,114,128,.10);
    }
    .tutorial-close-feedback.is-releasing {
      animation: tutorialCloseTapPulse 320ms cubic-bezier(.2,.8,.2,1) both;
    }
    @media (prefers-reduced-motion: reduce) {
      .tutorial-close-feedback,
      .tutorial-close-feedback.is-releasing { animation-duration:1ms !important; transition-duration:1ms !important; }
    }
  `;
  document.head.appendChild(style);
}

function isEnglishMode() {
  if (document.documentElement.dataset.relayLanguage === "en") return true;
  try {
    return localStorage.getItem("relay_home_language") === "en";
  } catch {
    return false;
  }
}

const EN_TOUR_TEXT = new Map([
  ["填寫任務標題", "Enter a Task Title"],
  ["先幫這個任務取個名字，", "Give your task a clear name. "],
  ["例如「週日爬山健行」「週五團購水果」。", "For example, “Sunday Hike” or “Friday Fruit Group Buy.” "],
  ["標題是唯一必填的欄位。", "The title is the only required field."],
  ["加入活動橫幅圖（選填）", "Add an Event Banner (optional)"],
  ["填寫簡介（選填）", "Add a Description (optional)"],
  ["簡單說明這個任務在做什麼，", "Briefly explain what this task is for. "],
  ["例如集合時間地點、", "For example, the meeting time and place, "],
  ["團購截止日，", "or the group-buy deadline. "],
  ["報名的人在報名頁就看得到。", "Participants will see it on the signup page."],
  ["選擇日期", "Choose Dates"],
  ["設定任務的起始日和到期日，", "Set the task start date and end date. "],
  ["點一下就會打開日期選擇器。", "Tap either date to open the date picker."],
  ["報名人數上限（選填）", "Set a Signup Limit (optional)"],
  ["設定最多幾人可以報名，", "Set the maximum number of participants. "],
  ["額滿後就無法再報名。", "Once full, no more signups will be accepted. "],
  ["不填代表不限人數。", "Leave it blank for unlimited signups."],
  ["備註（選填）", "Add Notes (optional)"],
  ["其他想提醒大家的事項，", "Add anything else participants should know. "],
  ["付款方式。", "or the payment method."],
  ["進階設定（選填）", "Advanced Settings (optional)"],
  ["需要調整任務模式、", "Open this only when you need to change the task mode, "],
  ["分類或統計數量時再展開，", "categories, or quantity tracking. "],
  ["沒有需要可以略過。", "Otherwise, you can skip it. "],
  ["預設會用一般報名。", "Standard Signup is used by default."],
  ["全部填寫好後，", "When everything looks right, "],
  ["按這個按鈕，", "tap this button. "],
  ["建立任務。", "This creates the task. "],
  ["完成後會跳到分享頁，", "You will then go to the share page "],
  ["再接續，", "to continue with "],
  ["最後一步教學。", "the final tutorial step."],
  ["任務建立好了！", "Your task is ready! "],
  ["把報名卡片分享到 LINE 群組或好友，", "Share the signup card with a LINE group or friend. "],
  ["大家點報名卡片就能直接報名。", "People can tap the card to sign up directly."],
  ["知道了，開始填寫", "Got it, Start Filling"],
]);

function fixEnglishTutorialLabels() {
  if (!isEnglishMode()) return;

  document.querySelectorAll("p,span,button").forEach((element) => {
    if (element.children.length > 0) return;
    const text = (element.textContent || "").replace(/\s+/g, " ").trim();
    const translated = EN_TOUR_TEXT.get(text);
    if (translated) element.textContent = translated;
  });

  document.querySelectorAll("button").forEach((button) => {
    const text = (button.textContent || "").replace(/\s+/g, " ").trim();
    if (text === "查看Standard Signup教學" || text === "查看 Standard Signup 教學") {
      button.textContent = "View Standard Signup Tutorial";
    } else if (text === "查看On-site Queue教學" || text === "查看 On-site Queue 教學") {
      button.textContent = "View On-site Queue Tutorial";
    } else if (text === "看完了") {
      button.textContent = "Done";
    }
  });
}

function isTutorialCloseButton(element) {
  if (!(element instanceof HTMLButtonElement)) return false;
  if ((element.textContent || "").trim() !== "✕") return false;
  const modal = element.closest(".fixed.inset-0");
  if (!modal) return false;
  const modalText = modal.textContent || "";
  return modalText.includes("教學") || modalText.includes("Tutorial");
}

function bindButton(button) {
  if (button.dataset.tutorialCloseFeedbackBound === "true") return;
  button.dataset.tutorialCloseFeedbackBound = "true";
  button.classList.add("tutorial-close-feedback");

  const press = () => {
    button.classList.remove("is-releasing");
    button.classList.add("is-pressed");
  };
  const release = () => {
    if (!button.classList.contains("is-pressed")) return;
    button.classList.remove("is-pressed");
    button.classList.add("is-releasing");
    window.setTimeout(() => button.classList.remove("is-releasing"), 340);
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
}

export default function TutorialCloseButtonFeedback() {
  useEffect(() => {
    ensureStyle();

    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        fixEnglishTutorialLabels();
        document.querySelectorAll("button").forEach((button) => {
          if (isTutorialCloseButton(button)) bindButton(button);
        });
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
