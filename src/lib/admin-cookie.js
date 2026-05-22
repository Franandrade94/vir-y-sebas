export const ADMIN_COOKIE_NAME = "admin_session";

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Compatible con Edge (middleware) y Node (server actions). */
export async function verifyAdminCookieValue(raw, secret) {
  if (!secret || secret.length < 16) return false;
  if (!raw || !raw.includes(".")) return false;

  const lastDot = raw.lastIndexOf(".");
  const token = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);
  const expected = await hmacSha256Hex(secret, token);

  return token.length > 0 && sig === expected;
}
