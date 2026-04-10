"use server";

import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth";
import { db } from "@/lib/prisma/db";
import { createSession } from "@/lib/auth/session";
import type { Permission, Role } from "@/lib/auth";

export type LoginState = { error: string } | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username ||
    !password
  ) {
    return { error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." };
  }

  const user = await db.user.findUnique({ where: { username } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Tên đăng nhập hoặc mật khẩu không chính xác." };
  }

  if (!user.isActive) {
    return { error: "Tài khoản đã bị vô hiệu hóa." };
  }

  const permissions: Permission[] = JSON.parse(user.permissions) as Permission[];

  await createSession({
    userId: user.id,
    username: user.username,
    role: user.role as Role,
    permissions,
  });

  redirect("/dashboard");
}
