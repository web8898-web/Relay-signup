"use client";

import { useEffect } from "react";

const JOIN_MESSAGE_PATTERN = /(?:✅\s*)?已加入排隊[！!]?/;
const CARD_LABEL = "目前等待順位";

function findSmallestElementContaining(text) {
  const elements = Array.from(document.querySelectorAll("body *"));
  return elements.find((element) => {
    if (!(element instanceof HTMLElement)) return false;
    if (!element.textContent?.includes(text)) return false;
    return !Array.from(element.children).some((child) => child.textContent?.includes(text));
  });
}

function findWaitingCard() {
  const label = findSmallestElementContaining(CARD_LABEL);
  if (!(label instanceof HTMLElement)) return null;

  const content = label.closest("div.bg-gradient-to-br") || label.parentElement;
  if (!(content instanceof HTMLElement)) return null;

  const card = content.parentElement;
  return card instanceof HTMLElement ? card : content;
}

function visibleRatio(element) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

  const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
  const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
  const visibleArea = visibleHeight * visibleWidth;
  const totalArea = Math.max(1, rect.width * rect.height);

  return visibleArea / totalArea;
}

function playHighlight(card) {
  card.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.03)" },
      { transform: "scale(1)" },
    ],
    {
      duration: 200,
      easing: "ease-out",
    }
  );
}

function normalizeJoinToast() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    if (JOIN_MESSAGE_PATTERN.test(node.nodeValue || "")) {
      node.nodeValue = (node.nodeValue || "").replace(JOIN_MESSAGE_PATTERN, "✅ 已加入排隊");
      return true;
    }
    node = walker.nextNode();
  }

  return false;
}

function focusWaitingCard() {
  let attempts = 0;

  const tryFocus = () => {
    const card = findWaitingCard();
    if (!card) {
      attempts += 1;
      if (attempts < 20) window.setTimeout(tryFocus, 100);
      return;
    }

    if (visibleRatio(card) >= 0.6) {
      playHighlight(card);
      return;
    }

    card.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => playHighlight(card), 280);
  };

  window.setTimeout(tryFocus, 300);
}

export default function QueueJoinAutoFocus() {
  useEffect(() => {
    let handledToast = null;

    const inspect = () => {
      const toastText = findSmallestElementContaining("已加入排隊");
      if (!(toastText instanceof HTMLElement) || toastText === handledToast) return;

      handledToast = toastText;
      normalizeJoinToast();
      focusWaitingCard();
    };

    inspect();

    const observer = new MutationObserver(inspect);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
