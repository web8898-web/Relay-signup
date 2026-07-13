"use client";

import { useEffect } from "react";

const HEADCOUNT_LABELS = new Set(["數量（人）", "數量（位）", "數量（名）", "數量（口）"]);

function applyHeadcountCategoryQuantityFix() {
  const hasCategorySelector = [...document.querySelectorAll("p")].some((el) =>
    (el.textContent || "").includes("選擇您要報名的類別")
  );

  document.querySelectorAll("[data-headcount-category-quantity-hidden='true']").forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.removeProperty("display");
      el.removeAttribute("data-headcount-category-quantity-hidden");
    }
  });

  if (!hasCategorySelector) return;

  [...document.querySelectorAll("span")].forEach((label) => {
    if (!(label instanceof HTMLElement)) return;
    const text = (label.textContent || "").trim();
    if (!HEADCOUNT_LABELS.has(text)) return;

    const stepper = label.parentElement;
    if (!(stepper instanceof HTMLElement)) return;
    stepper.style.setProperty("display", "none", "important");
    stepper.setAttribute("data-headcount-category-quantity-hidden", "true");
  });
}

export default function HeadcountCategoryQuantityFix() {
  useEffect(() => {
    let frame = 0;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(applyHeadcountCategoryQuantityFix);
    };

    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
