"use server";

import { db } from "@/lib/prisma/db";
import { requireSession } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type RecentMovement = {
  id: string;
  type: string;
  quantity: number;
  voucherStatus: string;
  note: string | null;
  createdAt: Date;
  product: { name: string; sku: string };
  location: { label: string };
  fromLocation: { label: string } | null;
  user: { username: string };
};

export type DashboardStats = {
  totalProducts: number;
  totalLocations: number;
  totalStockItems: number;
  pendingVouchers: number;
  recentMovements: RecentMovement[];
  topProducts: { name: string; quantity: number }[];
};

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    await requireSession();

    const [
      totalProducts,
      totalLocations,
      stockAggregate,
      pendingVouchers,
      recentMovements,
      topInventory
    ] = await Promise.all([
      db.product.count(),
      db.location.count(),
      db.inventory.aggregate({ _sum: { quantity: true } }),
      db.stockMovement.count({ where: { voucherStatus: "PENDING" } }),
      db.stockMovement.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          quantity: true,
          voucherStatus: true,
          note: true,
          createdAt: true,
          product: { select: { name: true, sku: true } },
          location: { select: { label: true } },
          fromLocation: { select: { label: true } },
          user: { select: { username: true } },
        },
      }),
      db.inventory.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      })
    ]);

    // get product names for top products
    const productIds = topInventory.map(i => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });
    
    const topProducts = topInventory.map(inv => ({
      name: products.find(p => p.id === inv.productId)?.name || "Unknown",
      quantity: inv._sum.quantity || 0
    }));

    return {
      success: true,
      data: {
        totalProducts,
        totalLocations,
        totalStockItems: stockAggregate._sum.quantity ?? 0,
        pendingVouchers,
        recentMovements,
        topProducts,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
