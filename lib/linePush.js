// Sends a LINE push message to a single user via the Messaging API.
// Requires LINE_CHANNEL_ACCESS_TOKEN to be set as a server-side env var
// (Vercel → Settings → Environment Variables). This is intentionally NOT
// prefixed with NEXT_PUBLIC_, since it must never be exposed to the browser.
//
// Note: LINE will only actually deliver the message if the recipient has
// added this Official Account as a friend — otherwise the API call still
// "succeeds" from our side but the user never receives anything. We treat
// push failures as non-fatal so a signup never fails just because the
// notification couldn't be delivered.
export async function sendLinePush(userId, text) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !userId) return { ok: false, skipped: true };

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text: text.slice(0, 4900) }],
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn("LINE push failed", res.status, detail);
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (err) {
    console.warn("LINE push error", err);
    return { ok: false, error: String(err) };
  }
}
