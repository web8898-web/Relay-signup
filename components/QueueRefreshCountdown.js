"use client";

import { useEffect } from "react";

const REFRESH_SECONDS = 5;

export default function QueueRefreshCountdown() {
  useEffect(() => {
    let remaining = REFRESH_SECONDS;
    let active = false;

    function updateDisplay() {
      const labels = Array.from(document.querySelectorAll("p")).filter((node) => {
        const text = node.textContent?.trim();
        return text === "更新頻率" || text === "資料更新";
      });

      if (labels.length === 0) {
        active = false;
        remaining = REFRESH_SECONDS;
        return;
      }

      if (!active) {
        active = true;
        remaining = REFRESH_SECONDS;
      }

      labels.forEach((label) => {
        label.textContent = "資料更新";
        const value = label.nextElementSibling;
        if (value) {
          value.innerHTML = `${remaining}<span class="text-sm ml-1">秒</span>`;
        }
      });

      remaining = remaining <= 1 ? REFRESH_SECONDS : remaining - 1;
    }

    updateDisplay();
    const timer = window.setInterval(updateDisplay, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
