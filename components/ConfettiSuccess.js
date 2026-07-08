"use client";

import { CheckCircle2 } from "lucide-react";

const PIECES = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  left: `${8 + ((i * 37) % 84)}%`,
  delay: `${(i % 7) * 0.08}s`,
  duration: `${1.25 + (i % 5) * 0.12}s`,
  rotate: `${(i * 29) % 180}deg`,
  color: ["#55B786", "#F59E0B", "#60A5FA", "#F472B6", "#A78BFA"][i % 5],
}));

export default function ConfettiSuccess({ show, message = "報名成功！" }) {
  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-white/10 animate-[confetti-fade_1.6s_ease-out_forwards]" />
      {PIECES.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-24px] w-2 h-4 rounded-sm animate-[confetti-drop_var(--duration)_cubic-bezier(.16,.8,.25,1)_var(--delay)_forwards]"
          style={{
            left: p.left,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate})`,
            "--delay": p.delay,
            "--duration": p.duration,
          }}
        />
      ))}
      <div className="relative bg-white border border-emerald-100 rounded-[28px] px-6 py-5 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.45)] flex flex-col items-center animate-[success-pop_1.35s_ease-out_forwards]">
        <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200 mb-2">
          <CheckCircle2 size={30} />
        </div>
        <p className="font-bold text-gray-800">{message}</p>
        <p className="text-xs text-gray-400 mt-1">已加入接龍名單</p>
      </div>
    </div>
  );
}
