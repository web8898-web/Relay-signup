export const LANGUAGE_KEY = "relay_home_language";
export const LANGUAGE_EVENT = "relay-language-updated";

export function getClientLanguage() {
  if (typeof window === "undefined") return "zh";
  const parameter = new URLSearchParams(window.location.search).get("lang");
  if (parameter === "en" || parameter === "zh") return parameter;
  try { return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh"; }
  catch { return "zh"; }
}
