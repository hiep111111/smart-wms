import { cookies } from "next/headers";
import {
  SessionPayload,
  COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  createToken,
  verifyToken,
} from "@/lib/auth";

export type { SessionPayload };

export async function createSession(
  payload: Omit<SessionPayload, "iat" | "exp">
): Promise<void> {
  const token = await createToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Keep these aliases so callers that import encrypt/decrypt still work
export { createToken as encrypt, verifyToken as decrypt };
