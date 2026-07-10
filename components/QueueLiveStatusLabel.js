"use client";

import { useEffect } from "react";

const OLD_TEXT = "即時更新中";
const NEW_TEXT = "排隊狀態即時同步";

export default function QueueLiveStatusLabel() {
  useEffect(() => {
    function updateLabels(root = document.body) {
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
    }

    updateLabels();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) updateLabels(node);
          if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim() === OLD_TEXT) {
            node.nodeValue = NEW_TEXT;
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
