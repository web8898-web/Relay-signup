"use client";
import { X } from "lucide-react";

export default function ImageModal({ src, title, onClose }) {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[88vh] bg-white rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="關閉"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/70 transition z-10"
        >
          <X size={18} />
        </button>
        <div className="overflow-y-auto max-h-[88vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={title || "教學圖片"} className="w-full h-auto block" />
        </div>
      </div>
    </div>
  );
}
