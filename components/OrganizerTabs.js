"use client";
import Link from "next/link";

export default function OrganizerTabs({ current }) {
  const isTasks = current === "tasks";
  return (
    <div className="px-6 pt-3 pb-1">
      <div className="relative flex bg-gray-100 rounded-full p-1">
        {/* Sliding highlight — a single element that transforms between the
            two positions, instead of each tab independently toggling its
            own background. That's what makes it read as "sliding" rather
            than "one turns off, the other turns on" at the same time. */}
        <div
          className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-out"
          style={{ transform: isTasks ? "translateX(100%)" : "translateX(0%)" }}
        />
        <Link
          href="/create"
          className={`relative flex-1 text-center text-sm py-2 rounded-full font-medium transition-colors duration-300 ${
            current === "new" ? "text-emerald-600" : "text-gray-400"
          }`}
        >
          建立任務
        </Link>
        <Link
          href="/my-tasks"
          className={`relative flex-1 text-center text-sm py-2 rounded-full font-medium transition-colors duration-300 ${
            isTasks ? "text-emerald-600" : "text-gray-400"
          }`}
        >
          任務清單
        </Link>
      </div>
    </div>
  );
}
