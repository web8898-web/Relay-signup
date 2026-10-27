"use client";
import { useSyncExternalStore } from "react";
import { getClientLanguage, LANGUAGE_EVENT } from "@/lib/locale";

function subscribe(callback) {
  window.addEventListener(LANGUAGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(LANGUAGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useLanguage() {
  return useSyncExternalStore(subscribe, getClientLanguage, () => "zh");
}
