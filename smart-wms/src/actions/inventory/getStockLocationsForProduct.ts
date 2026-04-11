"use server";

import { db } from "@/lib/prisma/db";
import { requireSession } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type StockLocationItem = {
  locationId: string;
  label: string;
  quantity: number;
};

export async function getStockLocationsForProduct(
  productId: string
): Promise<ActionResult<StockLocationItem[]>> {
  try {
    await requireSession();

    if (!productId) {
      return { success: true, data: [] };
    }

    const inventories = await db.inventory.findMany({
      where: {
        productId,
        quantity: { gt: 0 },
      },
      include: {
        location: { select: { label: true } },
      },
      orderBy: { quantity: "desc" },
    });

    const data = inventories.map((inv) => ({
      locationId: inv.locationId,
      label: inv.location.label,
      quantity: inv.quantity,
    }));

    return { success: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
