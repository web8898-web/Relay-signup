"use client";
import { initLiff, liff } from "@/lib/liff";
import { getClientLanguage } from "@/lib/locale";

export async function downloadExport(taskId, format, accessToken) {
  const en = getClientLanguage() === "en";
  let popup;
  try {
    const inLine = liff.isInClient?.();
    if (!inLine) popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    await initLiff();
    const response = await fetch(`/api/tasks/${taskId}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken || liff.getAccessToken()}` },
      body: JSON.stringify({ format, language: en ? "en" : "zh" }),
    });
    const data = await response.json();
    if (!response.ok || !data.url) throw new Error("export failed");
    const url = new URL(data.url, window.location.origin).toString();
    if (inLine) liff.openWindow({ url, external: true });
    else if (popup) popup.location.href = url;
    else window.location.assign(url);
  } catch {
    popup?.close();
    window.alert(en ? "Unable to export. Please sign in as the organizer and try again." : "匯出失敗，請以主辦人身分登入後再試一次。");
  }
}
