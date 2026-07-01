"use client";
import { useEffect } from "react";
import { initLiff, liff } from "@/lib/liff";

export default function LiffBootstrap() {
  useEffect(() => {
    (async () => {
      try {
        await initLiff();
        if (liff.isLoggedIn()) {
          const target = sessionStorage.getItem("liff-redirect-after-login");
          if (target) {
            sessionStorage.removeItem("liff-redirect-after-login");
            if (target !== window.location.pathname) {
              window.location.replace(target);
            }
          }
        }
      } catch (e) {}
    })();
  }, []);
  return null;
}
