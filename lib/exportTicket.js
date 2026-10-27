import { createHmac, timingSafeEqual } from "node:crypto";

function signature(payload, secret) {
  if (!secret) throw new Error("Export signing is not configured");
  return createHmac("sha256", secret).update(`relay-export:${payload}`).digest("base64url");
}

export function createExportTicket(taskId, format, language, secret, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ taskId, format, language, expires: now + 120000 })).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export function readExportTicket(ticket, taskId, secret, now = Date.now()) {
  try {
    const parts = String(ticket || "").split(".");
    if (parts.length !== 2) return null;
    const expected = Buffer.from(signature(parts[0], secret));
    const received = Buffer.from(parts[1]);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    return data.taskId === taskId && Number.isFinite(data.expires) && data.expires > now ? data : null;
  } catch { return null; }
}
