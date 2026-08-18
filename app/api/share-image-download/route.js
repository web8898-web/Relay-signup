export const runtime = "nodejs";

function safeFilename(value = "relay-signup.png") {
  const cleaned = String(value)
    .replace(/[\\/:*?"<>|\r\n]/g, "_")
    .slice(0, 80)
    .trim();
  return cleaned || "relay-signup.png";
}

export async function POST(request) {
  try {
    const form = await request.formData();
    const data = String(form.get("data") || "");
    const filename = safeFilename(form.get("filename") || "relay-signup.png");
    const prefix = "data:image/png;base64,";

    if (!data.startsWith(prefix)) {
      return new Response("Invalid image data", { status: 400 });
    }

    const base64 = data.slice(prefix.length);
    if (!base64 || base64.length > 12_000_000) {
      return new Response("Image is too large", { status: 413 });
    }

    const bytes = Buffer.from(base64, "base64");
    const encoded = encodeURIComponent(filename);

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(bytes.length),
        "Content-Disposition": `attachment; filename="relay-signup.png"; filename*=UTF-8''${encoded}`,
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Unable to prepare image download", { status: 500 });
  }
}
