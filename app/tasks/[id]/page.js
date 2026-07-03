// A thin Server Component wrapper — route segment config like
// `force-dynamic` only reliably takes effect when it's exported from a
// Server Component (Next.js does not apply it when exported from a file
// with "use client"). All the actual interactive logic lives in
// TaskDetailClient (a Client Component) so this file stays server-only.
// This mirrors the same fix already applied to app/my-tasks/page.js.
export const dynamic = "force-dynamic";

import TaskDetailClient from "@/components/TaskDetailClient";

export default function TaskDetailPage() {
  return <TaskDetailClient />;
}
