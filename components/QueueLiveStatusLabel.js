"use client";

import { useEffect } from "react";

const OLD_STATUS_TEXT = "即時更新中";
const NEW_STATUS_TEXT = "排隊狀態即時同步";

function replaceExactText(root, fromText, toText) {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    if (root.nodeValue?.trim() === fromText) root.nodeValue = toText;
    return;
  }

  if (!(root instanceof Element || root === document.body)) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue?.trim() === fromText) node.nodeValue = toText;
  }
}

function updateQueueDialog(dialog) {
  if (!(dialog instanceof HTMLElement)) return;

  const heading = dialog.querySelector("h3");
  const dialogText = dialog.textContent || "";
  const isQueueLeaveDialog =
    heading?.textContent?.includes("排隊") ||
    dialogText.includes("失去目前順位") ||
    dialogText.includes("返回等待") ||
    dialogText.includes("確定取消") ||
    dialogText.includes("繼續等待") ||
    dialogText.includes("離開排隊");

  if (!isQueueLeaveDialog) return;

  if (heading && heading.textContent?.trim() !== "確定要離開排隊嗎？") {
    heading.textContent = "確定要離開排隊嗎？";
  }

  const description = heading?.nextElementSibling;
  if (
    description instanceof HTMLParagraphElement &&
    description.textContent?.trim() !== "重新加入時，將重新排到最後一位。"
  ) {
    description.textContent = "重新加入時，將重新排到最後一位。";
  }

  dialog.classList.add("backdrop-blur-sm");

  dialog.querySelectorAll("button").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;

    button.classList.add(
      "h-12",
      "py-0",
      "transition-transform",
      "duration-150",
      "active:scale-95"
    );

    const text = button.textContent?.trim();

    if (text === "返回等待") {
      button.textContent = "繼續等待";
      return;
    }

    if (text === "確定取消") {
      button.textContent = "離開排隊";
      return;
    }

    if ((text === "取消中…" || text === "離開中…") && !button.dataset.queueLeavingUi) {
      button.dataset.queueLeavingUi = "true";
      button.setAttribute("aria-busy", "true");
      button.innerHTML =
        '<span>離開中</span>' +
        '<span class="ml-1.5 inline-flex items-center gap-1" aria-hidden="true">' +
        '<span class="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>' +
        '<span class="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>' +
        '<span class="h-1.5 w-1.5 rounded-full bg-white animate-bounce"></span>' +
        "</span>";
    }
  });
}

function updateUi(root = document.body) {
  if (!root) return;

  replaceExactText(root, OLD_STATUS_TEXT, NEW_STATUS_TEXT);
  replaceExactText(root, "不排了", "取消排隊");
  replaceExactText(root, "已取消排隊", "已離開排隊");

  if (root instanceof HTMLElement && root.matches('[role="dialog"]')) {
    updateQueueDialog(root);
  }

  if (root instanceof Element || root === document.body) {
    root.querySelectorAll?.('[role="dialog"]').forEach(updateQueueDialog);
  }
}

export default function QueueLiveStatusLabel() {
  useEffect(() => {
    updateUi();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          const textNode = mutation.target;
          const value = textNode.nodeValue?.trim();

          if (value === OLD_STATUS_TEXT) textNode.nodeValue = NEW_STATUS_TEXT;
          if (value === "不排了") textNode.nodeValue = "取消排隊";
          if (value === "已取消排隊") textNode.nodeValue = "已離開排隊";

          const dialog = textNode.parentElement?.closest?.('[role="dialog"]');
          if (dialog) updateQueueDialog(dialog);
          continue;
        }

        mutation.addedNodes.forEach((node) => updateUi(node));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
