export const CATEGORIES = [
  "Learning",
  "Productivity",
  "Lifestyle",
  "Developer tools",
  "Finance",
  "Business",
  "Games",
];
export const STATUSES = [
  "Unreviewed",
  "Live",
  "In progress",
  "Planned",
  "Archived",
];
export const PRIVATE = [
  "repo",
  "firebase",
  "account",
  "email",
  "roles",
  "users",
  "notes",
];
export const STORAGE_KEY = "mmusa-studio-v1";
export function safeUrl(value, image = false) {
  if (!value) return "";
  if (
    image &&
    (/^\/images\/[\w.-]+$/.test(value) ||
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value))
  )
    return value;
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}
export function validateRecords(input) {
  if (!Array.isArray(input) || input.length > 500)
    throw new Error("Choose a backup containing up to 500 apps.");
  const ids = new Set();
  return input.map((x) => {
    if (
      !x ||
      typeof x !== "object" ||
      typeof x.id !== "string" ||
      !/^[\w-]{1,100}$/.test(x.id) ||
      ids.has(x.id)
    )
      throw new Error("Every app must have a unique valid ID.");
    ids.add(x.id);
    const result = {};
    for (const key of [
      "id",
      "name",
      "description",
      "url",
      "image",
      "color",
      "category",
      "status",
      "pricing",
      "dateAdded",
      ...PRIVATE,
    ]) {
      if (x[key] != null && typeof x[key] !== "string")
        throw new Error(`Invalid ${key} field.`);
      result[key] = x[key] || "";
      if (result[key].length > (key === "image" ? 700000 : 10000))
        throw new Error(`${key} is too long.`);
    }
    if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email))
      throw new Error("Enter a valid contact email.");
    if (!result.name.trim() || result.name.length > 100)
      throw new Error("App names must contain 1–100 characters.");
    if (
      !CATEGORIES.includes(result.category) ||
      !STATUSES.includes(result.status)
    )
      throw new Error("Choose a valid category and status.");
    if (!["Free", "Paid", "Freemium", "Not set"].includes(result.pricing))
      throw new Error("Choose a valid pricing option.");
    for (const k of ["url", "repo"])
      if (result[k] && !safeUrl(result[k]))
        throw new Error(`${k} must start with https:// or http://.`);
    if (result.image && !safeUrl(result.image, true))
      throw new Error("Choose a JPG, PNG or WebP image, or use an image URL.");
    if (!/^#[0-9a-f]{6}$/i.test(result.color)) result.color = "#147d73";
    result.featured = x.featured === true;
    return result;
  });
}
export function publicRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => !PRIVATE.includes(key)),
  );
}
export function privateRecord(record) {
  return Object.fromEntries(PRIVATE.map((key) => [key, record[key] || ""]));
}
