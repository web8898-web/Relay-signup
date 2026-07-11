"use client";

import { useEffect } from "react";

export default function TaskListSpacingFix() {
  useEffect(() => {
    const styleId = "relay-task-list-spacing-fix";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      /*
        Keep the task list in normal document flow so the bottom action follows
        the last task instead of being pushed to the very bottom of the screen.
        Long lists remain independently scrollable.
      */
      .flex-1.px-6.py-3.flex.flex-col.gap-3.overflow-y-auto {
        flex: 0 1 auto !important;
        max-height: calc(100dvh - 12.5rem) !important;
        padding-bottom: calc(4.5rem + env(safe-area-inset-bottom)) !important;
        scroll-padding-bottom: calc(4.5rem + env(safe-area-inset-bottom)) !important;
      }

      @supports not (height: 100dvh) {
        .flex-1.px-6.py-3.flex.flex-col.gap-3.overflow-y-auto {
          max-height: calc(100vh - 12.5rem) !important;
        }
      }
    `;

    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return null;
}
