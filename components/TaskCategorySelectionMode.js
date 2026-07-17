"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const SINGLE_MARKER = "__relay_category_single__";
const MULTIPLE_MARKER = "__relay_category_multiple__";
const CONFIG_PREFIX = "__relay_";

function taskIdFromPath(pathname) {
  const match = String(pathname || "").match(/^\/tasks\/([^/?#]+)/);
  return match?.[1] || "";
}

function isSelected(button) {
  return button.dataset.selected === "true" || String(button.className || "").includes("bg-emerald-500");
}

function categoryGroup(button) {
  return button.closest(".category-multi-signup-categories")?.querySelector("div.flex") ||
    button.parentElement;
}

function hideConfigMarkers() {
  document.querySelectorAll("button, span").forEach((element) => {
    const text = (element.textContent || "").trim();
    if (text.startsWith(CONFIG_PREFIX)) element.style.setProperty("display", "none", "important");
  });
}

function updateCopy(mode) {
  [...document.querySelectorAll("p")].forEach((element) => {
    const text = (element.textContent || "").trim();
    if (!text.includes("選擇您要報名的類別")) return;
    element.textContent = mode === "single"
      ? "👉 選擇您要報名的類別（單選）"
      : "👉 選擇您要報名的類別（可複選）";
  });
  [...document.querySelectorAll(".category-multi-signup-categories > p")].forEach((element) => {
    element.textContent = mode === "single"
      ? "👉 選擇代報者的分類（單選）"
      : "👉 選擇代報者的分類（可複選）";
  });
}

export default function TaskCategorySelectionMode() {
  const pathname = usePathname();

  useEffect(() => {
    const taskId = taskIdFromPath(pathname);
    if (!taskId) return;

    let active = true;
    let mode = "multiple";
    let frame = 0;
    let changing = false;

    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        hideConfigMarkers();
        updateCopy(mode);
      });
    };

    const onClickCapture = (event) => {
      if (mode !== "single" || changing) return;
      const button = event.target?.closest?.("button");
      if (!(button instanceof HTMLButtonElement)) return;
      const text = (button.textContent || "").trim();
      if (!text || text.startsWith(CONFIG_PREFIX)) return;
      const group = categoryGroup(button);
      if (!(group instanceof HTMLElement)) return;
      const candidateButtons = [...group.querySelectorAll("button")].filter((item) => {
        const itemText = (item.textContent || "").trim();
        return itemText && !itemText.startsWith(CONFIG_PREFIX);
      });
      if (!candidateButtons.includes(button) || isSelected(button)) return;

      changing = true;
      candidateButtons.filter((item) => item !== button && isSelected(item)).forEach((item) => item.click());
      changing = false;
    };

    (async () => {
      const { data } = await supabase.from("tasks").select("categories").eq("id", taskId).single();
      if (!active) return;
      const categories = Array.isArray(data?.categories) ? data.categories : [];
      mode = categories.includes(SINGLE_MARKER)
        ? "single"
        : categories.includes(MULTIPLE_MARKER)
          ? "multiple"
          : "multiple";
      refresh();
    })();

    document.addEventListener("click", onClickCapture, true);
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    refresh();

    return () => {
      active = false;
      document.removeEventListener("click", onClickCapture, true);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
