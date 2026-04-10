import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma/db";
import {
  verifyPassword,
  createToken,
  COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth";
import type { Permission, Role } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON." },
      },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).username !== "string" ||
    typeof (body as Record<string, unknown>).password !== "string" ||
    !(body as Record<string, unknown>).username ||
    !(body as Record<string, unknown>).password
  ) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "username and password are required." },
      },
      { status: 400 }
    );
  }

  const { username, password } = body as { username: string; password: string };

  const user = await db.user.findUnique({ where: { username } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Incorrect username or password." },
      },
      { status: 401 }
    );
  }

  if (!user.isActive) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "ACCOUNT_DISABLED", message: "This account has been deactivated." },
      },
      { status: 403 }
    );
  }

  const permissions: Permission[] = JSON.parse(user.permissions) as Permission[];

  const token = await createToken({
    userId: user.id,
    username: user.username,
    role: user.role as Role,
    permissions,
  });

  const response = NextResponse.json(
    {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role as Role,
          permissions,
          createdAt: user.createdAt.toISOString(),
        },
      },
    },
    { status: 200 }
  );

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });

  return response;
}
