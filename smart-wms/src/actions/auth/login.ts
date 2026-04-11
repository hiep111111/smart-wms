"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma/db";
import { createSession } from "@/lib/auth/session";
import type { Role } from "@/lib/auth/types";

export type LoginResult = { success: false; error: string };

export async function login(credentials: {
  username: string;
  password: string;
}): Promise<LoginResult | void> {
  const { username, password } = credentials;

  if (!username.trim() || !password) {
    return { success: false, error: "MISSING_CREDENTIALS" };
  }

  const user = await db.user.findUnique({
    where: { username: username.trim() },
    include: {
      permissionsReceived: { select: { permissionKey: true } },
    },
  });

  if (!user || !user.isActive) {
    return { success: false, error: "INVALID_CREDENTIALS" };
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return { success: false, error: "INVALID_CREDENTIALS" };
  }

  await createSession({
    userId: user.id,
    username: user.username,
    role: user.role as Role,
    permissions: user.permissionsReceived.map((p) => p.permissionKey),
    isActive: user.isActive,
  });

  // redirect() throws NEXT_REDIRECT — must not be inside try/catch
  redirect("/dashboard");
}
