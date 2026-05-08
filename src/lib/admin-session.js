import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "admin_session";

/** Sesión admin (cookie firmada). La clave en DB no expira; la sesión puede renovarse al entrar. */
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 días

export async function setAdminSession() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "ADMIN_SESSION_SECRET debe tener al menos 16 caracteres (generá una cadena aleatoria)."
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const sig = crypto.createHmac("sha256", secret).update(token).digest("hex");
  const value = `${token}.${sig}`;

  const jar = await cookies();
  jar.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function verifyAdminSession() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) return false;

  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw || !raw.includes(".")) return false;

  const lastDot = raw.lastIndexOf(".");
  const token = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);
  const expected = crypto.createHmac("sha256", secret).update(token).digest("hex");

  return token.length > 0 && sig === expected;
}
