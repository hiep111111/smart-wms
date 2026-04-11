"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type CreateInboundInput = {
  productId: string;
  locationId: string;
  quantity: number;
  note?: string;
};

export async function createInbound(
  input: CreateInboundInput
): Promise<ActionResult<{ movementId: string }>> {
  try {
    const session = await requirePermission("inventory:in");

    if (!input.productId || !input.locationId) {
      return { success: false, error: "Product and location are required.", code: "VALIDATION_ERROR" };
    }
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      return { success: false, error: "Quantity must be a positive integer.", code: "VALIDATION_ERROR" };
    }

    const movement = await db.$transaction(async (tx) => {
      // Upsert inventory — create row on first stock-in, increment on subsequent
      await tx.inventory.upsert({
        where: {
          productId_locationId: {
            productId: input.productId,
            locationId: input.locationId,
          },
        },
        create: {
          productId: input.productId,
          locationId: input.locationId,
          quantity: input.quantity,
        },
        update: { quantity: { increment: input.quantity } },
      });

      // Mark the location as occupied
      await tx.location.update({
        where: { id: input.locationId },
        data: { status: "FULL" },
      });

      // Audit record
      return tx.stockMovement.create({
        data: {
          type: "IN",
          quantity: input.quantity,
          productId: input.productId,
          locationId: input.locationId,
          userId: session.userId,
          voucherStatus: "APPROVED",
          approvedBy: session.userId,
          approvedAt: new Date(),
          note: input.note ?? null,
        },
      });
    });

    revalidatePath("/dashboard/movements");
    revalidatePath("/dashboard/locations");
    return { success: true, data: { movementId: movement.id } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
