import { MessageCircle } from "lucide-react";

export default function LoadingBubble({ size = 24, label, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-6 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
        <MessageCircle size={size} />
      </div>
      <div className="flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
      </div>
      {label && <p className="text-xs text-gray-400">{label}</p>}
    </div>
  );
}
