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
    }

    syncQueueControls();
    const observer = new MutationObserver(syncQueueControls);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
