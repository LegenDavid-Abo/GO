import crypto from "crypto";

export function newToken() {
  return crypto.randomBytes(32).toString("base64url");
}
export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}