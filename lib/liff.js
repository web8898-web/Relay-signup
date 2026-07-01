"use client";
import liff from "@line/liff";

let initPromise = null;

// Initializes LIFF once per page load. Reads the LIFF ID from the public
// env var so the same code works in local dev and production.
export function initLiff() {
  if (!initPromise) {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      return Promise.reject(
        new Error("缺少 NEXT_PUBLIC_LIFF_ID，請在 .env.local 設定你的 LIFF ID")
      );
    }
    initPromise = liff.init({ liffId });
  }
  return initPromise;
}

export async function loginWithLine() {
  await initLiff();
  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href });
    return null; // browser will redirect
  }
  return getLineProfile();
}

export async function getLineProfile() {
  await initLiff();
  if (!liff.isLoggedIn()) return null;
  const profile = await liff.getProfile();
  const accessToken = liff.getAccessToken();
  return { ...profile, accessToken };
}

export async function logoutLine() {
  await initLiff();
  if (liff.isLoggedIn()) liff.logout();
}

export async function isInClient() {
  await initLiff();
  return liff.isInClient();
}

export { liff };
