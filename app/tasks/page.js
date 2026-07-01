"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// This page used to be a public "browse all tasks" list, but the task
// list is now private (only the creator can see their own tasks via
// /my-tasks). Keeping this route reachable would leak every organizer's
// task titles/descriptions to anyone, so it just bounces people home.
export default function TaskListPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center text-emerald-500">
      <Loader2 className="animate-spin" size={28} />
    </div>
  );
}
