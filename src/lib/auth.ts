import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// ── Domain types ──────────────────────────────────────────────────────────────

export type Role =
  | "ADMIN"
  | "DIRECTOR"
  | "DEPUTY_DIRECTOR"
  | "WAREHOUSE_MANAGER"
  | "WAREHOUSE_STAFF"
  | "OFFICE_STAFF"
  | "CHIEF_ACCOUNTANT"
  | "DEPUTY_ACCOUNTANT"
  | "ACCOUNTING_STAFF"
  | "SALES_STAFF";

export type Permission =
  | "STOCK_IN"
  | "STOCK_OUT"
  | "VIEW_WAREHOUSE_MAP"
  | "VIEW_MOVEMENT_HISTORY"
  | "VIEW_REPORTS"
  | "VIEW_INVENTORY"
  | "VIEW_MOVEMENTS_ACCT";

export type SessionPayload = {
  userId: string;
  username: string;
  role: Role;
  permissions: Permission[];
  iat: number;
  exp: number;
};

// ── JWT config ─────────────────────────────────────────────────────────────────

const COOKIE_NAME = "wms_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 hours

export { COOKIE_NAME, SESSION_DURATION_SECONDS };

function getJwtKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

// ── Password helpers ───────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── Token helpers ──────────────────────────────────────────────────────────────

export async function createToken(
  payload: Omit<SessionPayload, "iat" | "exp">
): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtKey());
}

export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
