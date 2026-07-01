// Server-only. Verifies an access token that the client got from LIFF
// (liff.getAccessToken()) directly against LINE's own servers, so a
// request can't fake being a different LINE user. Never trust a
// client-supplied userId/displayName for writes — always derive it here.

export async function verifyLineAccessToken(accessToken) {
  if (!accessToken) {
    throw new Error("缺少 LINE access token");
  }

  const verifyRes = await fetch(
    `https://api.line.me/oauth2/v2.1/verify?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!verifyRes.ok) {
    throw new Error("LINE access token 無效或已過期");
  }
  const verifyData = await verifyRes.json();

  const expectedChannelId = process.env.LINE_LOGIN_CHANNEL_ID;
  if (expectedChannelId && String(verifyData.client_id) !== String(expectedChannelId)) {
    throw new Error("access token 不屬於本應用的 LINE Login channel");
  }

  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) {
    throw new Error("無法取得 LINE 個人資料");
  }
  const profile = await profileRes.json();
  return profile; // { userId, displayName, pictureUrl, statusMessage }
}

export function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}
