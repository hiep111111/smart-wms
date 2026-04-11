"use server";

import { db } from "@/lib/prisma/db";
import { requireRole } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type UserDetail = {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  permissions: string[];
};

export async function getUser(id: string): Promise<ActionResult<UserDetail | null>> {
  try {
    await requireRole(["ADMIN", "DIRECTOR"]);

    const user = await db.user.findUnique({
      where: { id },
      include: { permissionsReceived: true },
    });

    if (!user) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        permissions: user.permissionsReceived.map((p) => p.permissionKey),
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
