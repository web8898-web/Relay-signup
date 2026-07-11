"use client";

import { useEffect } from "react";

function findShareImagePanel() {
  const headings = Array.from(document.querySelectorAll("p")).filter(
    (element) => element.textContent?.trim() === "分享圖片"
  );

  for (const heading of headings) {
    const panel = heading.closest("div.mt-5.bg-white");
    if (!(panel instanceof HTMLElement)) continue;

    const buttons = Array.from(panel.querySelectorAll("button"));
    const shareButton = buttons.find((button) => button.textContent?.trim() === "分享圖片");
    const saveButton = buttons.find((button) => button.textContent?.trim() === "儲存圖片");

    if (!(shareButton instanceof HTMLButtonElement) || !(saveButton instanceof HTMLButtonElement)) continue;

    const buttonRow = shareButton.parentElement;
    if (buttonRow instanceof HTMLElement) {
      buttonRow.classList.remove("grid-cols-2");
      buttonRow.classList.add("grid-cols-1");
    }

    const textNodes = Array.from(shareButton.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE);
    const lastTextNode = textNodes.at(-1);
    if (lastTextNode) lastTextNode.textContent = " 分享／儲存圖片";

    shareButton.setAttribute("aria-label", "分享或儲存圖片");
    saveButton.remove();
  }
}

export default function TaskShareImageActionFix() {
  useEffect(() => {
    findShareImagePanel();

    let frame = 0;
    const observer = new MutationObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(findShareImagePanel);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
