"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await requirePermission("inventory:manage");

    // Block deletion if the product has any inventory records
    const inventoryCount = await db.inventory.count({
      where: { productId: id },
    });

    if (inventoryCount > 0) {
      return {
        success: false,
        error: "Cannot delete product that has existing inventory.",
        code: "HAS_INVENTORY",
      };
    }

    await db.product.delete({ where: { id } });

    revalidatePath("/dashboard/products");
    return { success: true, data: undefined };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
