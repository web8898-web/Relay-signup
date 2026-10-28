export function signupOrderValue(signup) {
  return Number.isSafeInteger(signup.signup_order) && signup.signup_order > 0 ? signup.signup_order : null;
}

// Timestamps are only a fallback for older cached data. Preserve PostgreSQL's
// microseconds; Date alone truncates the ordered offsets of proxy signups.
export function compareSignupOrder(a, b) {
  const an = signupOrderValue(a), bn = signupOrderValue(b);
  if (an !== null && bn !== null && an !== bn) return an - bn;
  const time = Date.parse(a.created_at) - Date.parse(b.created_at);
  if (Number.isFinite(time) && time !== 0) return time;
  const remainder = value => Number((String(value).match(/\.(\d+)/)?.[1] || '').padEnd(6, '0').slice(3, 6));
  const micros = remainder(a.created_at) - remainder(b.created_at);
  if (micros) return micros;
  return String(a.id).localeCompare(String(b.id));
}

export function orderedSignups(signups) {
  return [...signups].sort(compareSignupOrder);
}
