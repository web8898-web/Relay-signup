"use client";

import { useEffect } from "react";

const MODE_COPY = {
  一般報名: "適合事先收集報名名單，活動開始前即可確認人數。",
  現場排隊: "適合現場候位與排隊，客人加入後可依序叫號服務。",
};

function normalize(value = "") {
  return String(value).replace(/\s+/g, "").trim();
}

function findModeSection() {
  const headings = Array.from(document.querySelectorAll("body *")).filter((element) => {
    if (!(element instanceof HTMLElement)) return false;
    return normalize(element.textContent) === "任務模式";
  });

  for (const heading of headings) {
    let current = heading.parentElement;
    for (let depth = 0; current instanceof HTMLElement && depth < 7; depth += 1) {
      const text = normalize(current.textContent);
      if (text.includes("一般報名") && text.includes("現場排隊")) return current;
      current = current.parentElement;
    }
  }

  return null;
}

function updateCardCopy(section, title, nextCopy) {
  const buttons = Array.from(section.querySelectorAll("button"));
  const card = buttons.find((button) => {
    const text = normalize(button.textContent);
    return text.includes(normalize(title));
  });

  if (!(card instanceof HTMLElement)) return;

  const copyElement = Array.from(card.querySelectorAll("p")).find((element) => {
    if (!(element instanceof HTMLElement)) return false;
    const text = normalize(element.textContent);
    return text.startsWith("適合") || element.dataset.taskModeCopy === title;
  });

  if (!(copyElement instanceof HTMLElement)) return;
  if (copyElement.textContent !== nextCopy) copyElement.textContent = nextCopy;
  copyElement.dataset.taskModeCopy = title;
}

function applyModeCopy() {
  if (!window.location.pathname.startsWith("/create") || window.location.pathname.startsWith("/create/share")) return;

  const section = findModeSection();
  if (!(section instanceof HTMLElement)) return;

  Object.entries(MODE_COPY).forEach(([title, copy]) => updateCardCopy(section, title, copy));
}

export default function TaskModeCopyFix() {
  useEffect(() => {
    const apply = () => window.requestAnimationFrame(applyModeCopy);

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const fallback = window.setInterval(applyModeCopy, 500);
    const stopFallback = window.setTimeout(() => window.clearInterval(fallback), 8000);

    return () => {
      observer.disconnect();
      window.clearInterval(fallback);
      window.clearTimeout(stopFallback);
    };
  }, []);

  return null;
}
