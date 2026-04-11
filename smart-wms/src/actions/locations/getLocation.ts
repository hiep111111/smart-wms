"use server";

import { db } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export async function getLocation(id: string): Promise<ActionResult<any>> {
  try {
    const session = await requirePermission("locations:view");

    const location = await db.location.findUnique({
      where: { id },
    });

    if (!location) {
      return { success: false, error: "Location not found", code: "NOT_FOUND" };
    }

    return { success: true, data: location };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
