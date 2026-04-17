"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";
import type { Role } from "@/lib/auth/types";

export type CreateUserInput = {
  username: string;
  passwordRaw: string;
  role: Role;
};

export async function createUser({ username, passwordRaw, role }: CreateUserInput): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("user:view");
    
    if (session.role !== "ADMIN" && session.role !== "DIRECTOR" && session.role !== "DEPUTY_DIRECTOR") {
      return { success: false, error: "Only admins and directors can create users", code: "FORBIDDEN" };
    }

    if (!username || username.trim().length < 3) {
      return { success: false, error: "Username must be at least 3 characters", code: "VALIDATION" };
    }
    if (!passwordRaw || passwordRaw.length < 6) {
      return { success: false, error: "Password must be at least 6 characters", code: "VALIDATION" };
    }

    const passwordHash = await bcrypt.hash(passwordRaw, 10);

    const user = await db.user.create({
      data: {
        username: username.trim(),
        passwordHash,
        role,
        isActive: true,
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true, data: { id: user.id } };
  } catch (e: any) {
    if (e.code === "P2002") {
      return { success: false, error: "Username already exists", code: "CONFLICT" };
    }
    return { success: false, error: e.message || "INTERNAL_ERROR", code: "INTERNAL" };
  }
}
