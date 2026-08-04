// Web Crypto (crypto.subtle) only, on purpose - this file runs in the Edge
// middleware runtime (protecting /admin) as well as Node route handlers, and
// only globalThis.crypto.subtle is guaranteed available in both.

const COOKIE_NAME = "agatha_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8h shared-password session (V1)

async function hmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder().encode(secret);
  return crypto.subtle.importKey("raw", enc, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function sign(payload: string): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const key = await hmacKey(secret);
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Buffer.from(sigBuf).toString("hex");
}

export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `admin.${expires}`;
  const sig = await sign(payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expiresStr, sig] = parts;
  const payload = `${role}.${expiresStr}`;
  const expected = await sign(payload);
  if (!constantTimeEqual(sig, expected)) return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  return role === "admin";
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(digest).toString("hex");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkAdminPassword(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const [a, b] = await Promise.all([sha256Hex(password), sha256Hex(expected)]);
  return constantTimeEqual(a, b);
}

export async function checkExportToken(token: string): Promise<boolean> {
  const expected = process.env.EXPORT_TOKEN;
  if (!expected) return false;
  const [a, b] = await Promise.all([sha256Hex(token), sha256Hex(expected)]);
  return constantTimeEqual(a, b);
}

export { COOKIE_NAME, SESSION_TTL_MS };
