"use client";

import { useEffect } from "react";

function isEnglishMode() {
  if (typeof document === "undefined") return false;
  if (document.documentElement.dataset.relayLanguage === "en") return true;
  try {
    return localStorage.getItem("relay_home_language") === "en";
  } catch {
    return false;
  }
}

function fixTutorialText(root = document) {
  if (!isEnglishMode()) return;

  root.querySelectorAll?.("button").forEach((button) => {
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

export default function EnglishTutorialTextGuard() {
  useEffect(() => {
    if (!isEnglishMode()) return;

    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => fixTutorialText(document));
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
