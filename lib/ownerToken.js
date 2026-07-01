"use client";

// Participants don't log in, so we give each browser a random, private
// "owner token" the first time it's needed and keep it in localStorage.
// The server stores this token alongside each signup a person creates, and
// only accepts edit/delete requests that present the matching token. It's
// an honor-system identifier (like most real-world relay signup sheets),
// not cryptographic proof of identity.
const KEY = "relay-signup-owner-token";

export function getOwnerToken() {
  if (typeof window === "undefined") return null;
  let token = window.localStorage.getItem(KEY);
  if (!token) {
    token = crypto.randomUUID();
    window.localStorage.setItem(KEY, token);
  }
  return token;
}

const MINE_KEY = "relay-signup-my-signup-ids";

export function rememberMySignup(id) {
  const list = getMySignupIds();
  if (!list.includes(id)) {
    list.push(id);
    window.localStorage.setItem(MINE_KEY, JSON.stringify(list));
  }
}

export function forgetMySignup(id) {
  const list = getMySignupIds().filter((x) => x !== id);
  window.localStorage.setItem(MINE_KEY, JSON.stringify(list));
}

export function getMySignupIds() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(MINE_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
