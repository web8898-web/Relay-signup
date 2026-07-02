import { MessageCircle } from "lucide-react";

export default function LoadingBubble({ size = 24, label, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-6 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center animate-bounce shadow-md shadow-emerald-200">
        <MessageCircle size={size} />
      </div>
      {label && <p className="text-xs text-gray-400">{label}</p>}
    </div>
  );
}
