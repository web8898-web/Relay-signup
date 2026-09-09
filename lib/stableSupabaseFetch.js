// Ensure every signup list that is already ordered by registration time has a
// deterministic tie-breaker. PostgreSQL does not guarantee row order when two
// rows have the same created_at value, which can make displayed signup numbers
// swap after a refresh. The id is used only when created_at is identical.

function rewriteSignupOrderUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!url.pathname.endsWith("/rest/v1/signups")) return rawUrl;

    const order = url.searchParams.get("order");
    if (!order) return rawUrl;

    const parts = order.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.some((part) => /^id\.(asc|desc)/.test(part))) return rawUrl;

    const createdAtOrder = parts.find((part) => /^created_at\.(asc|desc)/.test(part));
    if (!createdAtOrder) return rawUrl;

    const direction = createdAtOrder.startsWith("created_at.desc") ? "desc" : "asc";
    parts.push(`id.${direction}`);
    url.searchParams.set("order", parts.join(","));
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function rewriteRequestInput(input) {
  if (typeof input === "string") return rewriteSignupOrderUrl(input);
  if (typeof URL !== "undefined" && input instanceof URL) {
    return new URL(rewriteSignupOrderUrl(input.toString()));
  }

  if (typeof Request !== "undefined" && input instanceof Request) {
    const nextUrl = rewriteSignupOrderUrl(input.url);
    if (nextUrl === input.url) return input;

    // Only ordered SELECT requests reach this path, so no request body needs
    // to be copied. Preserve the request metadata Supabase/PostgREST relies on.
    return new Request(nextUrl, {
      method: input.method,
      headers: input.headers,
      mode: input.mode,
      credentials: input.credentials,
      cache: input.cache,
      redirect: input.redirect,
      referrer: input.referrer,
      referrerPolicy: input.referrerPolicy,
      integrity: input.integrity,
      keepalive: input.keepalive,
      signal: input.signal,
    });
  }

  return input;
}

export function stableSupabaseFetch(input, init) {
  return globalThis.fetch(rewriteRequestInput(input), init);
}
