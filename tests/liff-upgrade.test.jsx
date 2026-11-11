import test from "node:test";
import assert from "node:assert/strict";
import liff from "@line/liff";
import { buildLocalizedFlexMessage, buildLocalizedShareText } from "@/lib/localizedShare";
import { lineShareUrl } from "@/lib/utils";
import { GET as getShortLink } from "@/app/s/[code]/route";

// This imports the installed SDK, not the application's mocked LIFF boundary.
// It verifies package/API compatibility; it does not simulate LINE authentication.
test("installed LIFF is 2.32.0 and exposes the APIs used by this app", () => {
  assert.equal(liff.getVersion(), "2.32.0");
  for (const api of ["init", "login", "logout", "isLoggedIn", "getProfile", "getAccessToken", "isInClient", "isApiAvailable", "shareTargetPicker", "openWindow"]) {
    assert.equal(typeof liff[api], "function", api);
  }
});

const returnUrl = "https://example.com/return?keyword=a?b&next=x%2By#part";
const query = new URLSearchParams({ lang: "en", return_url: returnUrl, label: "A&B + 中文" }).toString();
const signupUrl = `https://relay-signup.vercel.app/s/abc123?${query}`;
const task = { id: "task-1", title: "Test Event", task_mode: "normal", categories: [], start_date: "2026-11-11", end_date: "2026-11-12" };

test("Flex actions and fallback LINE text preserve URL-valued query parameters", () => {
  const message = buildLocalizedFlexMessage(task, signupUrl);
  const actions = message.contents.footer.contents.map(item => new URL(item.action.uri));
  assert.equal(actions.length, 2);
  for (const url of actions) {
    assert.equal(url.searchParams.get("return_url"), returnUrl);
    assert.equal(url.searchParams.get("label"), "A&B + 中文");
    assert.equal(url.searchParams.get("lang"), "en");
  }
  assert.equal(actions[0].searchParams.get("mode"), null);
  assert.equal(actions[1].searchParams.get("mode"), "view");
  const text = buildLocalizedShareText(task, signupUrl);
  assert.equal(new URL(lineShareUrl(text)).searchParams.get("text"), text);
  assert.ok(text.includes(signupUrl));
});

for (const exists of [true, false]) {
  test(`short link preserves nested query for ${exists ? "active" : "removed"} task`, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init = {}) => {
      const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
      assert.equal(url.hostname, "test.supabase.co");
      assert.equal(url.pathname, "/rest/v1/tasks");
      assert.equal(init.method || "GET", "GET");
      assert.equal(url.searchParams.get("short_code"), "eq.abc123");
      return new Response(JSON.stringify(exists ? { id: "task-1" } : null), { headers: { "Content-Type": "application/json" } });
    };
    try {
      const incoming = `${signupUrl}&mode=view`;
      const response = await getShortLink(new Request(incoming), { params: { code: "abc123" } });
      const target = new URL(response.headers.get("location"));
      assert.equal(response.status, 307);
      assert.equal(target.pathname, exists ? "/tasks/task-1" : "/tasks/removed");
      assert.equal(target.search, new URL(incoming).search);
      assert.equal(target.searchParams.get("return_url"), returnUrl);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}
