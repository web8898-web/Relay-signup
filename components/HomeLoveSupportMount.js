"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import HomeLoveSupport from "@/components/HomeLoveSupport";
import { useLineProfile } from "@/lib/useLineProfile";

export default function HomeLoveSupportMount() {
  const pathname = usePathname();
  const { profile, login } = useLineProfile();
  const [mountNode, setMountNode] = useState(null);

  useEffect(() => {
    if (pathname !== "/") {
      setMountNode(null);
      return;
    }

    let cancelled = false;
    let observer;

    const attach = () => {
      if (cancelled) return true;
      const companyLink = document.querySelector('a[href="https://www.wiweb.com.tw"]');
      const footer = companyLink?.closest("div");
      if (!(footer instanceof HTMLElement) || !(footer.parentElement instanceof HTMLElement)) return false;

      let node = document.getElementById("home-love-support-mount");
      if (!(node instanceof HTMLElement)) {
        node = document.createElement("div");
        node.id = "home-love-support-mount";
        node.className = "w-full";
        footer.parentElement.insertBefore(node, footer);
      }
      setMountNode(node);
      return true;
    };

    if (!attach()) {
      observer = new MutationObserver(() => {
        if (attach()) observer?.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      const node = document.getElementById("home-love-support-mount");
      if (node?.parentElement) node.parentElement.removeChild(node);
      setMountNode(null);
    };
  }, [pathname]);

  if (pathname !== "/" || !mountNode) return null;

  return createPortal(
    <HomeLoveSupport profile={profile} onRequireLogin={login} />,
    mountNode
  );
}
