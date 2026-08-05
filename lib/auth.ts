// Separate from lib/session.ts on purpose: this uses next/headers, which is
// only valid inside route handlers/server components, not the Edge
// middleware runtime that also imports session.ts's token functions directly.
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken, type SessionAccount } from "@/lib/session";

/** For use in route handlers / server components. Middleware already gates "is there a session at all" - this is for the additional CTO-only checks specific routes need. */
export async function getCurrentAccount(): Promise<SessionAccount | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
