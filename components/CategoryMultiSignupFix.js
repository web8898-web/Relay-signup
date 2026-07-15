"use client";

import { useEffect } from "react";

const INPUT_CLASS = "category-multi-signup-input w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition";

function isEligiblePage() {
  const categoryTitle = [...document.querySelectorAll("p")].find((el) =>
    (el.textContent || "").includes("選擇您要報名的類別")
  );
  if (!categoryTitle) return false;

  const hasStepperButtons = [...document.querySelectorAll("button")].some((button) => {
    const label = button.getAttribute("aria-label") || "";
    return label.includes("增加") || label.includes("減少");
  });
  return !hasStepperButtons;
}

function findPrimaryNameInput() {
  return [...document.querySelectorAll("input")].find((input) => {
    const placeholder = input.getAttribute("placeholder") || "";
    return placeholder === "你的姓名" || placeholder.includes("報名姓名");
  });
}

function getAvailableCategories() {
  const title = [...document.querySelectorAll("p")].find((el) =>
    (el.textContent || "").includes("選擇您要報名的類別")
  );
  const scroller = title?.nextElementSibling?.querySelector?.("div.flex") || title?.parentElement?.querySelector?.("div.flex");
  if (!scroller) return [];
  return [...scroller.querySelectorAll("button")]
    .map((button) => (button.textContent || "").trim())
    .filter(Boolean);
}

function createCategorySelector(categories) {
  const wrapper = document.createElement("div");
  wrapper.className = "category-multi-signup-categories";
  wrapper.innerHTML = '<p class="text-[11px] font-semibold text-emerald-700 mb-1.5 px-0.5">👉 選擇代報者的分類（可複選）</p>';
  const row = document.createElement("div");
  row.className = "flex gap-1.5 overflow-x-auto pb-1 px-1";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.dataset.category = category;
    button.dataset.selected = "false";
    button.className = "shrink-0 text-xs px-3 py-1.5 rounded-full border transition bg-white text-gray-500 border-gray-200";
    button.addEventListener("click", () => {
      const selected = button.dataset.selected !== "true";
      button.dataset.selected = selected ? "true" : "false";
      button.className = selected
        ? "shrink-0 text-xs px-3 py-1.5 rounded-full border transition bg-emerald-500 text-white border-emerald-500"
        : "shrink-0 text-xs px-3 py-1.5 rounded-full border transition bg-white text-gray-500 border-gray-200";
    });
    row.appendChild(button);
  });
  wrapper.appendChild(row);
  return wrapper;
}

function createProxyRow(container) {
  const categories = getAvailableCategories();
  const row = document.createElement("div");
  row.className = "category-multi-signup-row flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-white/70 p-2.5";

  const selector = createCategorySelector(categories);
  row.appendChild(selector);

  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 60;
  input.placeholder = "幫別人報名（選填）";
  input.className = INPUT_CLASS;
  row.appendChild(input);

  input.addEventListener("input", () => {
    ensureRows(container);
    updateHint(container);
  });
  container.insertBefore(row, container.querySelector("[data-category-multi-hint]") || null);
}

function collectEntries(primary) {
  const primaryName = (primary?.value || "").trim();
  const proxyEntries = [...document.querySelectorAll(".category-multi-signup-row")]
    .map((row) => ({
      name: (row.querySelector("input.category-multi-signup-input")?.value || "").trim(),
      categories: [...row.querySelectorAll("button[data-category][data-selected='true']")].map((button) => button.dataset.category),
    }))
    .filter((entry) => entry.name);
  return { primaryName, proxyEntries };
}

function updateHint(container) {
  const { primaryName, proxyEntries } = collectEntries(findPrimaryNameInput());
  const hint = container.querySelector("[data-category-multi-hint]");
  if (hint) hint.textContent = primaryName && proxyEntries.length ? `這次共幫 ${proxyEntries.length + 1} 位報名` : "";
}

function ensureRows(container) {
  const primary = findPrimaryNameInput();
  const hasPrimaryName = !!primary?.value?.trim();
  const rows = [...container.querySelectorAll(".category-multi-signup-row")];

  if (!hasPrimaryName) {
    rows.forEach((row) => row.remove());
    updateHint(container);
    return;
  }

  if (rows.length === 0 || rows[rows.length - 1].querySelector("input")?.value.trim()) createProxyRow(container);

  const updated = [...container.querySelectorAll(".category-multi-signup-row")];
  while (
    updated.length > 1 &&
    !updated[updated.length - 1].querySelector("input")?.value.trim() &&
    !updated[updated.length - 2].querySelector("input")?.value.trim()
  ) {
    updated[updated.length - 1].remove();
    updated.pop();
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
  const hint = document.createElement("p");
  hint.setAttribute("data-category-multi-hint", "true");
  hint.className = "text-[11px] text-emerald-600 px-2 -mt-0.5";
  root.appendChild(hint);
  primary.insertAdjacentElement("afterend", root);

  primary.addEventListener("input", () => ensureRows(root));
  ensureRows(root);
}

export default function CategoryMultiSignupFix() {
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init = {}) => {
      try {
        const url = typeof input === "string" ? input : input?.url || "";
        if (url.includes("/api/signups") && String(init?.method || "GET").toUpperCase() === "POST" && isEligiblePage()) {
          const { proxyEntries } = collectEntries(findPrimaryNameInput());
          if (proxyEntries.length && typeof init.body === "string") {
            const body = JSON.parse(init.body);
            body.proxy_entries = proxyEntries;
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
