"use server";

import { db } from "@/lib/prisma/db";
import { requireSession } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export async function getStockAtLocation(input: {
  productId: string;
  locationId: string;
}): Promise<ActionResult<{ quantity: number }>> {
  try {
    await requireSession();

    const inventory = await db.inventory.findUnique({
      where: {
        productId_locationId: {
          productId: input.productId,
          locationId: input.locationId,
        },
      },
      select: { quantity: true },
    });

    return { success: true, data: { quantity: inventory?.quantity ?? 0 } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
