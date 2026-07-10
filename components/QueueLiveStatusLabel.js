"use client";

import { useEffect } from "react";

const OLD_TEXT = "即時更新中";
const NEW_TEXT = "排隊狀態即時同步";

function replaceText(root, fromText, toText) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue?.trim() === fromText) node.nodeValue = toText;
  }
}

function syncQueueDialog() {
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));

  dialogs.forEach((dialog) => {
    if (!(dialog instanceof HTMLElement)) return;

    const heading = dialog.querySelector("h3");
    const dialogText = dialog.textContent || "";
    const isQueueDialog =
      heading?.textContent?.includes("排隊") ||
      dialogText.includes("取消後會失去目前順位") ||
      dialogText.includes("返回等待") ||
      dialogText.includes("確定取消");

    if (!isQueueDialog) return;

    dialog.classList.add("backdrop-blur-sm");

    if (heading) {
      heading.textContent = "確定要離開排隊嗎？";
      heading.classList.add("leading-snug");
    }

    const description = heading?.nextElementSibling;
    if (description instanceof HTMLParagraphElement) {
      description.textContent = "重新加入時，將重新排到最後一位。";
      description.classList.remove("mt-2");
      description.classList.add("mt-1.5", "leading-relaxed");
    }

    const buttons = Array.from(dialog.querySelectorAll("button"));
    buttons.forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;

      button.classList.add(
        "h-12",
        "py-0",
        "transition-transform",
        "duration-150",
        "active:scale-95"
      );

      const text = button.textContent?.trim();
      if (text === "返回等待") button.textContent = "繼續等待";
      if (text === "確定取消") button.textContent = "離開排隊";

      if (text === "取消中…" || text === "離開中…") {
        button.setAttribute("aria-busy", "true");
        button.innerHTML =
          '<span>離開中</span>' +
          '<span class="ml-1.5 inline-flex items-center gap-1">' +
          '<span class="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>' +
          '<span class="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>' +
          '<span class="h-1.5 w-1.5 rounded-full bg-white animate-bounce"></span>' +
          "</span>";
      }
    });
  });

  replaceText(document.body, "不排了", "取消排隊");
  replaceText(document.body, "已取消排隊", "已離開排隊");
}

export default function QueueLiveStatusLabel() {
  useEffect(() => {
    function updateUi(root = document.body) {
      if (!root) return;

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue?.trim() !== OLD_TEXT) continue;

        node.nodeValue = NEW_TEXT;
        const label = node.parentElement;
        if (label) {
          label.className = "text-[12px] font-semibold text-emerald-700 whitespace-nowrap leading-tight";
        }
      }

      syncQueueDialog();
    }

    updateUi();

    const observer = new MutationObserver(() => updateUi());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
