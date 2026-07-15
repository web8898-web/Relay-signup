"use client";

import { useEffect } from "react";

const INPUT_CLASS = "category-multi-signup-input w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition";

function isEligiblePage() {
  const categoryTitle = [...document.querySelectorAll("p")].find((el) =>
    (el.textContent || "").includes("選擇您要報名的類別")
  );
  if (!categoryTitle) return false;

  const quantityLabel = [...document.querySelectorAll("span")].some((el) =>
    /^數量（.+）$/.test((el.textContent || "").trim()) || /（.+）$/.test((el.textContent || "").trim()) && el.closest("button")
  );
  const hasStepperButtons = [...document.querySelectorAll("button")].some((button) => {
    const label = button.getAttribute("aria-label") || "";
    return label.includes("增加") || label.includes("減少");
  });
  return !quantityLabel && !hasStepperButtons;
}

function findPrimaryNameInput() {
  return [...document.querySelectorAll("input")].find((input) => {
    const placeholder = input.getAttribute("placeholder") || "";
    return placeholder === "你的姓名" || placeholder.includes("報名姓名");
  });
}

function collectNames(primary) {
  const names = [primary?.value || ""];
  document.querySelectorAll("input.category-multi-signup-input").forEach((input) => names.push(input.value || ""));
  return names.map((name) => name.trim()).filter(Boolean);
}

function ensureTrailingBlank(container) {
  const inputs = [...container.querySelectorAll("input.category-multi-signup-input")];
  if (inputs.length === 0 || inputs[inputs.length - 1].value.trim()) {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 60;
    input.placeholder = "幫別人報名（選填）";
    input.className = INPUT_CLASS;
    input.addEventListener("input", () => {
      ensureTrailingBlank(container);
      const all = [...container.querySelectorAll("input.category-multi-signup-input")];
      while (all.length > 1 && !all[all.length - 1].value.trim() && !all[all.length - 2].value.trim()) {
        all[all.length - 1].remove();
        all.pop();
      }
      const count = collectNames(findPrimaryNameInput()).length;
      let hint = container.querySelector("[data-category-multi-hint]");
      if (!hint) {
        hint = document.createElement("p");
        hint.setAttribute("data-category-multi-hint", "true");
        hint.className = "text-[11px] text-emerald-600 px-2 -mt-0.5";
        container.appendChild(hint);
      }
      hint.textContent = count >= 2 ? `一次幫 ${count} 位報名（套用相同分類）` : "";
    });
    const hint = container.querySelector("[data-category-multi-hint]");
    container.insertBefore(input, hint || null);
  }
}

function mountFields() {
  document.querySelectorAll("[data-category-multi-signup-root]").forEach((el) => el.remove());
  if (!isEligiblePage()) return;
  const primary = findPrimaryNameInput();
  if (!(primary instanceof HTMLInputElement)) return;

  const root = document.createElement("div");
  root.setAttribute("data-category-multi-signup-root", "true");
  root.className = "flex flex-col gap-2";
  const helper = document.createElement("p");
  helper.className = "text-[11px] text-gray-400 px-2";
  helper.textContent = "幫別人報名時，可繼續填寫姓名；所有姓名會套用上方選擇的分類。";
  root.appendChild(helper);
  const hint = document.createElement("p");
  hint.setAttribute("data-category-multi-hint", "true");
  hint.className = "text-[11px] text-emerald-600 px-2 -mt-0.5";
  root.appendChild(hint);
  primary.insertAdjacentElement("afterend", root);
  ensureTrailingBlank(root);
}

export default function CategoryMultiSignupFix() {
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init = {}) => {
      try {
        const url = typeof input === "string" ? input : input?.url || "";
        if (url.includes("/api/signups") && String(init?.method || "GET").toUpperCase() === "POST" && isEligiblePage()) {
          const primary = findPrimaryNameInput();
          const names = collectNames(primary);
          if (names.length >= 2 && typeof init.body === "string") {
            const body = JSON.parse(init.body);
            body.name = names[0];
            body.names = names;
            init = { ...init, body: JSON.stringify(body) };
          }
        }
      } catch (e) {}
      return originalFetch(input, init);
    };

    let frame = 0;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!document.querySelector("[data-category-multi-signup-root]")) mountFields();
      });
    };
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.fetch = originalFetch;
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.querySelectorAll("[data-category-multi-signup-root]").forEach((el) => el.remove());
    };
  }, []);
  return null;
}
