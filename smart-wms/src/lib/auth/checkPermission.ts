import { getSession } from "./session";
import type { SessionPayload, Role } from "./types";
import { hasPermission } from "./permissions";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireRole(allowed: Role[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!allowed.includes(session.role)) throw new Error("FORBIDDEN");
  return session;
}

export async function requirePermission(key: string): Promise<SessionPayload> {
  const session = await requireSession();
  if (!hasPermission(session, key)) throw new Error("FORBIDDEN");
  return session;
}
