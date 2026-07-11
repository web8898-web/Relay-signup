"use client";

import { useEffect } from "react";

const MODE_COPY = {
  一般報名: "適合事先收集報名名單，活動開始前即可確認人數。",
  現場排隊: "適合現場候位與排隊，客人加入後可依序叫號服務。",
};

function normalize(value = "") {
  return String(value).replace(/\s+/g, "").trim();
}

function findExactText(text) {
  const wanted = normalize(text);
  return Array.from(document.querySelectorAll("body *")).find((element) => {
    if (!(element instanceof HTMLElement)) return false;
    if (normalize(element.textContent) !== wanted) return false;
    return !Array.from(element.children).some((child) => normalize(child.textContent) === wanted);
  });
}

function updateModeCopy(title, nextCopy) {
  const titleElement = findExactText(title);
  if (!(titleElement instanceof HTMLElement)) return;

  let card = titleElement.parentElement;
  for (let depth = 0; card instanceof HTMLElement && depth < 6; depth += 1) {
    const text = normalize(card.textContent);
    const hasThisMode = text.includes(normalize(title));
    const hasOtherMode = text.includes(normalize(title === "一般報名" ? "現場排隊" : "一般報名"));

    if (hasThisMode && !hasOtherMode) {
      const candidates = Array.from(card.querySelectorAll("p,span,div")).filter((element) => {
        if (!(element instanceof HTMLElement)) return false;
        if (element.children.length > 0) return false;
        const value = normalize(element.textContent);
        return value.startsWith("適合") && value !== normalize(nextCopy);
      });

      const copyElement = candidates[0];
      if (copyElement instanceof HTMLElement) {
        copyElement.textContent = nextCopy;
        copyElement.dataset.taskModeCopyUpdated = "true";
      }
      return;
    }

    card = card.parentElement;
  }
}

export default function TaskModeCopyFix() {
  useEffect(() => {
    const apply = () => {
      if (!window.location.pathname.startsWith("/create")) return;
      Object.entries(MODE_COPY).forEach(([title, copy]) => updateModeCopy(title, copy));
    };

    apply();
    const observer = new MutationObserver(() => window.requestAnimationFrame(apply));
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
