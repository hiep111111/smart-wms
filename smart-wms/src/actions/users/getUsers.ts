"use server";

import { db } from "@/lib/prisma/db";
import { requireRole } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type UserRow = {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  permissions: { permissionKey: string }[];
};

export async function getUsers(): Promise<ActionResult<UserRow[]>> {
  try {
    await requireRole(["ADMIN", "DIRECTOR"]);

    const users = await db.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        permissionsReceived: {
          select: { permissionKey: true },
        },
      },
    });

    return {
      success: true,
      data: users.map((u) => ({
        ...u,
        permissions: u.permissionsReceived,
      })),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
