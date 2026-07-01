"use client";
import { useEffect } from "react";
import { initLiff, liff } from "@/lib/liff";

export default function LiffBootstrap() {
  useEffect(() => {
    (async () => {
      try {
        await initLiff();
        if (liff.isLoggedIn()) {
          const raw = sessionStorage.getItem("liff-redirect-after-login");
          sessionStorage.removeItem("liff-redirect-after-login");
          if (raw) {
            try {
              const { path, ts } = JSON.parse(raw);
              const fresh = Date.now() - ts < 15000;
              if (fresh && path && path !== window.location.pathname) {
                window.location.replace(path);
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    })();
  }, []);
  return null;
}
