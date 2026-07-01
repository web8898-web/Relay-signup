"use client";
import { useEffect, useState, useCallback } from "react";
import { initLiff, getLineProfile, logoutLine, liff } from "@/lib/liff";

export function useLineProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isInClient, setIsInClient] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initLiff();
        setIsInClient(liff.isInClient());
        if (liff.isLoggedIn()) {
          const p = await getLineProfile();
          setProfile(p);
        }
      } catch (e) {
        setError(e.message || "LINE 登入初始化失敗");
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async () => {
    try {
      await initLiff();
      liff.login();
    } catch (e) {
      setError(e.message || "LINE 登入失敗，請重新整理頁面再試一次");
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutLine();
    if (typeof window !== "undefined") window.location.reload();
  }, []);

  return { profile, loading, error, login, logout, isInClient };
}
