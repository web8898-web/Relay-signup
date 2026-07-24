"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function HomeLaunchSplashTrigger() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") {
      window.__relayShowLaunchSplash?.();
      return;
    }

    document.getElementById("app-launch-splash")?.remove();
    document.documentElement.style.overflow = "";
  }, [pathname]);

  return null;
}
