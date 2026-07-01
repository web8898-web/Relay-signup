"use client";
import Link from "next/link";

export default function OrganizerTabs({ current }) {
  return (
    <div className="px-6 pt-3 pb-1">
      <div className="flex bg-gray-100 rounded-full p-1">
        <Link
          href="/create"
          className={`flex-1 text-center text-sm py-2 rounded-full font-medium transition ${current === "new" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400"}`}
        >
          建立任務
        </Link>
        <Link
          href="/my-tasks"
          className={`flex-1 text-center text-sm py-2 rounded-full font-medium transition ${current === "tasks" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400"}`}
        >
          任務清單
        </Link>
      </div>
    </div>
  );
}
