"use server";

import { db } from "@/lib/prisma/db";
import { requireSession } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  minQuantity: number;
  createdAt: Date;
};

export async function getProducts(): Promise<ActionResult<ProductRow[]>> {
  try {
    await requireSession();

    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        unit: true,
        minQuantity: true,
        createdAt: true,
      },
    });

    return { success: true, data: products };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
