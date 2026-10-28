import { orderedSignups } from "@/lib/signupOrder";
export async function loadSignupList(taskId, accessToken) {
  const response = await fetch(`/api/signups?task_id=${encodeURIComponent(taskId)}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}, cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to load signups");
  return orderedSignups(data.signups || []);
}
