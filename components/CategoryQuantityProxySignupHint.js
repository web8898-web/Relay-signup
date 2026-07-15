"use client";

import { useEffect } from "react";

const HINT_ID = "category-quantity-proxy-signup-hint";

function findSignupForm() {
  const categoryTitle = [...document.querySelectorAll("p")].find((element) =>
    (element.textContent || "").includes("選擇您要報名的類別")
  );
  if (!(categoryTitle instanceof HTMLElement)) return null;

  const form = categoryTitle.closest("div.border-t-2");
  if (!(form instanceof HTMLElement)) return null;

  const quantityLabel = [...form.querySelectorAll("span")].find((element) => {
    const text = (element.textContent || "").trim();
    return text.includes("（") && text.includes("）");
  });
  if (!(quantityLabel instanceof HTMLElement)) return null;

  return form;
}

function applyHint() {
  const form = findSignupForm();
  const existingHint = document.getElementById(HINT_ID);

  if (!form) {
    existingHint?.remove();
    return;
  }

  const nameInput = [...form.querySelectorAll("input")].find((input) => {
    const placeholder = input.getAttribute("placeholder") || "";
    return placeholder.includes("姓名");
  });

  if (nameInput instanceof HTMLInputElement) {
    nameInput.placeholder = "報名姓名（本人或幫別人代報）";
  }

  if (existingHint && form.contains(existingHint)) return;
  existingHint?.remove();

  const hint = document.createElement("div");
  hint.id = HINT_ID;
  hint.className = "rounded-2xl border border-emerald-100 bg-white px-3 py-2.5 text-left";
  hint.innerHTML = `
    <p class="text-[11px] font-semibold text-emerald-700">幫別人報名</p>
    <p class="mt-0.5 text-[11px] leading-relaxed text-gray-500">填寫其中一位代表姓名，再調整各分類數量即可，不需要逐一輸入同行者姓名。</p>
  `;

  const quantityContainer = [...form.querySelectorAll("div")].find((element) =>
    [...element.querySelectorAll(":scope > span")].some((span) => {
      const text = (span.textContent || "").trim();
      return text.includes("（") && text.includes("）");
    })
  );

  if (quantityContainer?.parentElement) {
    quantityContainer.parentElement.insertBefore(hint, quantityContainer);
  }
}

export default function CategoryQuantityProxySignupHint() {
  useEffect(() => {
    let frame = 0;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(applyHint);
    };

    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.getElementById(HINT_ID)?.remove();
    };
  }, []);

  return null;
}
