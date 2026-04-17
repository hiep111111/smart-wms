"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export async function toggleUserStatus(userId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const session = await requirePermission("user:view");
    
    if (session.role !== "ADMIN" && session.role !== "DIRECTOR" && session.role !== "DEPUTY_DIRECTOR") {
      return { success: false, error: "Only admins and directors can manage users", code: "FORBIDDEN" };
    }
    
    if (userId === session.userId && !isActive) {
      return { success: false, error: "You cannot deactivate your own account.", code: "VALIDATION" };
    }

    // Default admin cannot be deactivated
    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (targetUser?.username === "admin" && !isActive) {
      return { success: false, error: "Cannot deactivate primary admin account.", code: "VALIDATION" };
    }

    await db.user.update({
      where: { id: userId },
      data: { isActive },
    });

    revalidatePath("/dashboard/users");
    return { success: true, data: undefined };
  } catch (e: any) {
    return { success: false, error: e.message || "INTERNAL_ERROR", code: "INTERNAL" };
  }
}
