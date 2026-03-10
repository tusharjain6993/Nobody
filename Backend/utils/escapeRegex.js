/**
 * Escape special regex characters in a string to use safely in RegExp or $regex.
 * Prevents ReDoS and unexpected matching from user input.
 */
export function escapeRegex(str) {
  if (str == null || typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
