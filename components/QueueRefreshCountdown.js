"use client";

import { useEffect } from "react";

function findSection(node) {
  let current = node;
  while (current && current !== document.body) {
    if (current instanceof HTMLElement && current.classList.contains("border-t-2")) return current;
    current = current.parentElement;
  }
  return null;
}

function replaceButtonText(button, fromText, toText) {
  if (!(button instanceof HTMLButtonElement) || button.textContent?.trim() !== fromText) return;
  button.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.includes(fromText)) {
      node.textContent = node.textContent.replace(fromText, toText);
    }
  });
}

function syncLeaveQueueDialog() {
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));

  dialogs.forEach((dialog) => {
    if (!(dialog instanceof HTMLElement)) return;

    const heading = dialog.querySelector("h3");
    const isQueueDialog = heading?.textContent?.includes("排隊");
    if (!isQueueDialog) return;

    dialog.classList.add("backdrop-blur-sm");

    const card = heading.closest("div.w-full");
    if (card instanceof HTMLElement) {
      card.classList.add("transition-all", "duration-200");
    }

    if (heading.textContent !== "確定要離開排隊嗎？") {
      heading.textContent = "確定要離開排隊嗎？";
    }
    heading.classList.remove("mt-3");
    heading.classList.add("mt-3", "leading-snug");

    const description = heading.nextElementSibling;
    if (description instanceof HTMLParagraphElement) {
      const copy = "重新加入時，將重新排到最後一位。";
      if (description.textContent?.trim() !== copy) description.textContent = copy;
      description.classList.remove("mt-2");
      description.classList.add("mt-1.5", "leading-relaxed");
    }

    const buttons = Array.from(dialog.querySelectorAll("button"));
    buttons.forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;
      button.classList.add("h-12", "py-0", "transition-transform", "duration-150", "active:scale-95");

      replaceButtonText(button, "返回等待", "繼續等待");
      replaceButtonText(button, "確定取消", "離開排隊");

      const text = button.textContent?.trim();
      if (text === "取消中…" || text === "離開中…") {
        button.setAttribute("aria-busy", "true");
        if (!button.querySelector('[data-leaving-dots="true"]')) {
          button.innerHTML =
            '<span>離開中</span>' +
            '<span data-leaving-dots="true" class="ml-1.5 inline-flex items-center gap-1">' +
            '<span class="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>' +
            '<span class="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>' +
            '<span class="h-1.5 w-1.5 rounded-full bg-white animate-bounce"></span>' +
            "</span>";
        }
      }
    });
  });

  Array.from(document.querySelectorAll("div")).forEach((node) => {
    if (!(node instanceof HTMLDivElement)) return;
    if (node.textContent?.trim() === "已取消排隊") node.textContent = "已離開排隊";
  });
}

export default function QueueRefreshCountdown() {
  useEffect(() => {
    function syncQueueControls() {
      const pageText = document.body?.innerText || "";
      const isWaitingOnThisDevice = pageText.includes("目前等待順位");

      const queueNameInput = document.querySelector('input[placeholder*="現場排隊限本人"]');
      const queueFormSection = queueNameInput ? findSection(queueNameInput) : null;

      const queueEntryButton = Array.from(document.querySelectorAll("button")).find(
        (button) => button.textContent?.trim() === "我要排隊"
      );
      const queueEntrySection = queueEntryButton ? queueEntryButton.closest("div.border-t") : null;

      [queueFormSection, queueEntrySection].forEach((section) => {
        if (!(section instanceof HTMLElement)) return;

        if (isWaitingOnThisDevice) {
          if (!section.dataset.queueOriginalDisplay) {
            section.dataset.queueOriginalDisplay = section.style.display || "__empty__";
          }
          section.style.display = "none";
          section.setAttribute("aria-hidden", "true");
        } else if (section.dataset.queueOriginalDisplay) {
          section.style.display = section.dataset.queueOriginalDisplay === "__empty__" ? "" : section.dataset.queueOriginalDisplay;
          section.removeAttribute("aria-hidden");
          delete section.dataset.queueOriginalDisplay;
        }
      });

      Array.from(document.querySelectorAll("button")).forEach((button) => {
        replaceButtonText(button, "不排了", "取消排隊");
      });

      syncLeaveQueueDialog();
    }

    syncQueueControls();
    const observer = new MutationObserver(syncQueueControls);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
