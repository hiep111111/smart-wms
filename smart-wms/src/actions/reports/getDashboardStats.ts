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
  capacity: { status: string; count: number }[];
  lowStockItems: { id: string; name: string; sku: string; category: string | null; currentQty: number; minQty: number }[];
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
      topInventory,
      capacityStats,
      allInventoryGroups,
      allProducts
    ] = await Promise.all([
      db.product.count(),
      db.location.count(),
      db.inventory.aggregate({ _sum: { quantity: true } }),
      db.stockMovement.count({ where: { voucherStatus: "PENDING" } }),
      db.stockMovement.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, type: true, quantity: true, voucherStatus: true, note: true, createdAt: true,
          product: { select: { name: true, sku: true } },
          location: { select: { label: true } },
          fromLocation: { select: { label: true } },
          user: { select: { username: true } },
        },
      }),
      db.inventory.groupBy({
        by: ["productId"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5,
      }),
      db.location.groupBy({
        by: ["status"], _count: { status: true }
      }),
      db.inventory.groupBy({
        by: ["productId"], _sum: { quantity: true }
      }),
      db.product.findMany({ select: { id: true, name: true, sku: true, category: true, minQuantity: true } })
    ]);

    // get product names for top products
    const topProducts = topInventory.map(inv => ({
      name: allProducts.find(p => p.id === inv.productId)?.name || "Unknown",
      quantity: inv._sum.quantity || 0
    }));

    // Calculate Low Stock Items
    const lowStockItems = allProducts
      .filter(p => p.minQuantity > 0)
      .map(p => {
        const inv = allInventoryGroups.find(i => i.productId === p.id);
        const currentQty = inv?._sum.quantity || 0;
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          currentQty,
          minQty: p.minQuantity
        };
      })
      .filter(p => p.currentQty < p.minQty)
      .sort((a, b) => a.currentQty - b.currentQty)
      .slice(0, 10); // Show top 10 most critical

    const capacity = capacityStats.map(c => ({ status: c.status, count: c._count.status }));

    return {
      success: true,
      data: {
        totalProducts,
        totalLocations,
        totalStockItems: stockAggregate._sum.quantity ?? 0,
        pendingVouchers,
        recentMovements,
        topProducts,
        capacity,
        lowStockItems,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
