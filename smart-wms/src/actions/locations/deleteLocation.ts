"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export async function deleteLocation(id: string): Promise<ActionResult> {
  try {
    await requirePermission("locations:manage");

    // Block deletion if the location holds any inventory
    const inventoryCount = await db.inventory.count({
      where: { locationId: id },
    });

    if (inventoryCount > 0) {
      return {
        success: false,
        error: "Cannot delete location that contains inventory.",
        code: "HAS_INVENTORY",
      };
    }

    await db.location.delete({ where: { id } });

    revalidatePath("/dashboard/locations");
    return { success: true, data: undefined };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
