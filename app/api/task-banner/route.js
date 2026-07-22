import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getBearerToken, verifyLineAccessToken } from "@/lib/lineAuth";

const BUCKET = "task-banners";
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

function extensionFor(type) {
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  return "webp";
}

export async function POST(request) {
  try {
    const token = getBearerToken(request);
    const profile = await verifyLineAccessToken(token);
    const form = await request.formData();
    const file = form.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "請選擇圖片" }, { status: 400 });
    }

    const type = String(file.type || "").toLowerCase();
    const size = Number(file.size || 0);
    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: "只接受 JPG、PNG 或 WebP 圖片" }, { status: 400 });
    }
    if (!size || size > MAX_BYTES) {
      return NextResponse.json({ error: "處理後的圖片不能超過 3MB" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;

    if (!(buckets || []).some((bucket) => bucket.name === BUCKET)) {
      const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_BYTES,
        allowedMimeTypes: [...ALLOWED_TYPES],
      });
      if (bucketError && !String(bucketError.message || "").toLowerCase().includes("already")) {
        throw bucketError;
      }
    }

    const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${profile.userId}/${random}.${extensionFor(type)}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("無法取得圖片網址");

    return NextResponse.json({ url: data.publicUrl, path });
  } catch (error) {
    return NextResponse.json({ error: error.message || "圖片上傳失敗" }, { status: 400 });
  }
}
