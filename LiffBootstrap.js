"use client";
import { useEffect } from "react";
import { initLiff } from "@/lib/liff";

export default function LiffBootstrap() {
  useEffect(() => {
    initLiff().catch(() => {});
  }, []);
  return null;
}
