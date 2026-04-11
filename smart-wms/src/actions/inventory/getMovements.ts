"use server";

import { db } from "@/lib/prisma/db";
import { requireSession } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type MovementRow = {
  id: string;
  type: string;
  quantity: number;
  voucherStatus: string;
  note: string | null;
  createdAt: Date;
  product: { id: string; name: string; sku: string };
  location: { id: string; label: string };
  fromLocation: { id: string; label: string } | null;
  user: { id: string; username: string };
};

export async function getMovements(
  limit = 200
): Promise<ActionResult<MovementRow[]>> {
  try {
    await requireSession();

    const movements = await db.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        location: { select: { id: true, label: true } },
        fromLocation: { select: { id: true, label: true } },
        user: { select: { id: true, username: true } },
      },
    });

    return { success: true, data: movements };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
