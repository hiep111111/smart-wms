"use server";

import { db } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";
import { Prisma } from "@prisma/client";

export async function updateProduct(
  id: string,
  data: {
    name: string;
    description?: string;
    category?: string;
    unit: string;
    minQuantity: number;
    maxQuantity?: number;
  }
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("inventory:manage");
    // if (!hasPermission(session, "inventory:manage")) throw new Error("FORBIDDEN");

    const updated = await db.product.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        category: data.category?.trim() || null,
        unit: data.unit.trim(),
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity,
      },
    });

    return { success: true, data: { id: updated.id } };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return { success: false, error: "Product not found", code: "NOT_FOUND" };
      }
    }
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
