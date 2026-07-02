// A thin Server Component wrapper — route segment config like
// `force-dynamic` only reliably takes effect when it's exported from a
// Server Component (Next.js does not apply it when exported from a file
// with "use client"). All the actual interactive logic lives in
// MyTasksClient (a Client Component) so this file stays server-only.
export const dynamic = "force-dynamic";

import MyTasksClient from "@/components/MyTasksClient";

export default function MyTasksPage() {
  return <MyTasksClient />;
}
