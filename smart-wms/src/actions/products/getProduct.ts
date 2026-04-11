"use server";

import { db } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export async function getProduct(id: string): Promise<ActionResult<any>> {
  try {
    const session = await requirePermission("inventory:view");
    // if (!hasPermission(session, "inventory:view")) throw new Error("FORBIDDEN");

    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return { success: false, error: "Product not found", code: "NOT_FOUND" };
    }

    return { success: true, data: product };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
