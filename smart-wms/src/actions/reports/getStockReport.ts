"use server";

import { db } from "@/lib/prisma/db";
import { requireSession } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type StockReportRow = {
  productId: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  totalQuantity: number;
  locationCount: number;
};

export async function getStockReport(): Promise<ActionResult<StockReportRow[]>> {
  try {
    await requireSession();

    // Group inventory by product, summing quantities and counting distinct locations
    const rows = await db.inventory.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      _count: { locationId: true },
      orderBy: { _sum: { quantity: "desc" } },
    });

    if (rows.length === 0) return { success: true, data: [] };

    // Fetch product details for the returned ids
    const productIds = rows.map((r) => r.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, name: true, category: true, unit: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const data: StockReportRow[] = rows
      .map((r) => {
        const p = productMap.get(r.productId);
        if (!p) return null;
        return {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          unit: p.unit,
          totalQuantity: r._sum.quantity ?? 0,
          locationCount: r._count.locationId,
        };
      })
      .filter((r): r is StockReportRow => r !== null);

    return { success: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
