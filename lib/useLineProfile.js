"use client";
import { useEffect, useState, useCallback } from "react";
import { initLiff, getLineProfile, logoutLine, liff } from "@/lib/liff";

export function useLineProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await initLiff();
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

  const login = useCallback(() => {
    liff.login({ redirectUri: window.location.href });
  }, []);

  const logout = useCallback(async () => {
    await logoutLine();
    setProfile(null);
  }, []);

  return { profile, loading, error, login, logout };
}
