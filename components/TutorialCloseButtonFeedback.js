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

function isTutorialCloseButton(element) {
  if (!(element instanceof HTMLButtonElement)) return false;
  if ((element.textContent || "").trim() !== "✕") return false;
  const modal = element.closest(".fixed.inset-0");
  return !!modal && (modal.textContent || "").includes("教學");
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

    const apply = () => {
      document.querySelectorAll("button").forEach((button) => {
        if (isTutorialCloseButton(button)) bindButton(button);
      });
    };

    apply();
    const observer = new MutationObserver(() => window.requestAnimationFrame(apply));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
