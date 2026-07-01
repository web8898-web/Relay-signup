import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Public short-link redirect: /s/aB3xQ2 -> /tasks/<uuid>
// Reads are allowed by RLS ("public can read tasks"), so the plain anon
// client is enough here — no service role key needed.
export async function GET(request, { params }) {
  const { code } = params;

  const { data } = await supabase
    .from("tasks")
    .select("id")
    .eq("short_code", code)
    .single();

  if (!data) {
    return NextResponse.redirect(new URL("/tasks", request.url));
  }

  return NextResponse.redirect(new URL(`/tasks/${data.id}`, request.url));
}
