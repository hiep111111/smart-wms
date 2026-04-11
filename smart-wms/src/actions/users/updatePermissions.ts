"use server";

import { db } from "@/lib/prisma/db";
import { requireRole } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export async function updatePermissions(input: {
  userId: string;
  permissions: string[];
}): Promise<ActionResult<void>> {
  try {
    const session = await requireRole(["ADMIN", "DIRECTOR"]);

    await db.$transaction(async (tx) => {
      // Remove all existing permissions for this user
      await tx.permission.deleteMany({
        where: { granteeId: input.userId },
      });

      // Insert new permissions (skip if empty)
      if (input.permissions.length > 0) {
        await tx.permission.createMany({
          data: input.permissions.map((key) => ({
            grantorId: session.userId,
            granteeId: input.userId,
            permissionKey: key,
          })),
        });
      }
    });

    return { success: true, data: undefined };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
