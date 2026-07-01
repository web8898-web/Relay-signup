"use client";
import { useEffect, useRef, useState } from "react";
import { X, ImageOff } from "lucide-react";

const TRANSITION_MS = 280;

export default function ImageModal({ src, title, onClose }) {
  const [failed, setFailed] = useState(false);
  const [entered, setEntered] = useState(false);
  const closeTimer = useRef(null);

  useEffect(() => {
    setFailed(false);
    if (src) {
      setEntered(false);
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [src]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function handleRequestClose() {
    setEntered(false);
    closeTimer.current = setTimeout(() => {
      onClose();
    }, TRANSITION_MS);
  }

  if (!src) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/70 z-50 flex items-end justify-center transition-opacity ease-out ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      style={{ transitionDuration: `${TRANSITION_MS}ms` }}
      onClick={handleRequestClose}
    >
      <div
        className={`relative w-full max-w-md max-h-[88vh] bg-white rounded-t-3xl overflow-hidden shadow-2xl flex flex-col transition-transform ease-out ${
          entered ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ transitionDuration: `${TRANSITION_MS}ms` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <p className="font-semibold text-gray-800 text-sm">{title}</p>
          <button
            onClick={handleRequestClose}
            aria-label="關閉"
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto">
          {failed ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-300">
              <ImageOff size={32} />
              <p className="text-xs text-gray-400">圖片載入失敗，請稍後再試</p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={title || "教學圖片"}
              className="w-full h-auto block"
              onError={() => setFailed(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
