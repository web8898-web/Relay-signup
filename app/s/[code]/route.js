import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Public short-link redirect: /s/aB3xQ2 -> /tasks/<uuid>
// Reads are allowed by RLS ("public can read tasks"), so the plain anon
// client is enough here — no service role key needed.
export async function GET(request, { params }) {
  const { code } = params;

  // Preserve any query string from the short link (e.g. ?mode=view from
  // the "查看名單" share-card button) through the redirect — without this,
  // that param silently gets dropped and both share-card buttons end up
  // landing on the exact same page.
  const incomingUrl = new URL(request.url);

  const { data } = await supabase
    .from("tasks")
    .select("id")
    .eq("short_code", code)
    .single();

  if (!data) {
    const removedUrl = new URL("/tasks/removed", request.url);
    removedUrl.search = incomingUrl.search;
    return NextResponse.redirect(removedUrl);
  }

  const targetUrl = new URL(`/tasks/${data.id}`, request.url);
  targetUrl.search = incomingUrl.search;
  return NextResponse.redirect(targetUrl);
}
