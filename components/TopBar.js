"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function TopBar({ title, backHref, onBack, right }) {
  return (
    <div className="bg-emerald-500 text-white px-4 py-4 flex items-center gap-3 shadow-sm shrink-0">
      {backHref ? (
        <Link href={backHref} className="text-white/90 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
      ) : onBack ? (
        <button onClick={onBack} className="text-white/90 hover:text-white">
          <ArrowLeft size={20} />
        </button>
      ) : null}
      <p className="font-bold flex-1 truncate">{title}</p>
      {right}
    </div>
  );
}

export function EmptyState({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center py-14 text-gray-300">
      <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-300">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-400">{title}</p>
      <p className="text-xs text-gray-300 mt-1 max-w-[220px]">{desc}</p>
    </div>
  );
}
