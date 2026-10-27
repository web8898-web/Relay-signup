// Keep legacy metadata intact until a dedicated-column migration is deployed.
export const isTaskMarker = (value) => /^__relay_[a-z0-9_]+__(?::.*)?$/i.test(String(value || "").trim());

export function visibleCategories(categories = []) {
  return categories.filter((value) => !isTaskMarker(value));
}

export function visibleNote(note = "") {
  return String(note).split(/\r?\n/).filter((line) => !isTaskMarker(line)).join("\n").trim();
}

export function mergeTaskCategories(categories, original = []) {
  const visible = visibleCategories(categories);
  // Duplicate category markers encode Required. Never put these in a Set.
  const markers = original.filter((value) => isTaskMarker(value) &&
    (visible.length > 0 || !String(value).includes("category_")));
  return [...visible, ...markers];
}

export function mergeTaskNote(note, original = "") {
  const markers = String(original).split(/\r?\n/).filter(isTaskMarker);
  return [visibleNote(note), ...markers].filter(Boolean).join("\n");
}

export function noteWithBanner(note, bannerUrl) {
  return [String(note).split(/\r?\n/).filter((line) => !line.trim().startsWith("__relay_banner_url__:")).join("\n").trim(),
    bannerUrl ? `__relay_banner_url__:${bannerUrl}` : ""].filter(Boolean).join("\n");
}

export function toggleCategorySelection(selected, category, mode) {
  return selected.includes(category) ? selected.filter((value) => value !== category)
    : mode === "single" ? [category] : [...selected, category];
}
