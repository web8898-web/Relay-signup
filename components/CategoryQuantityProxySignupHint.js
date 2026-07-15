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

function removeProxySignupHint() {
  document.getElementById(HINT_ID)?.remove();

  const form = findSignupForm();
  if (!form) return;

  const nameInput = [...form.querySelectorAll("input")].find((input) => {
    const placeholder = input.getAttribute("placeholder") || "";
    return placeholder.includes("姓名");
  });

  if (nameInput instanceof HTMLInputElement) {
    nameInput.placeholder = "你的姓名";
  }
}

export default function CategoryQuantityProxySignupHint() {
  useEffect(() => {
    let frame = 0;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(removeProxySignupHint);
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
