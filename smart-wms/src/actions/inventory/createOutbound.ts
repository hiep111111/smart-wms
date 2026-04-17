"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type CreateOutboundInput = {
  productId: string;
  locationId: string;
  quantity: number;
  note?: string;
};

// Sentinel thrown inside the transaction so we can identify it in the catch block
class InsufficientStockError extends Error {
  readonly code = "INSUFFICIENT_STOCK";
  constructor(available: number, requested: number) {
    super(`Insufficient stock: requested ${requested}, available ${available}.`);
  }
}

export async function createOutbound(
  input: CreateOutboundInput
): Promise<ActionResult<{ movementId: string }>> {
  try {
    const session = await requirePermission("inventory:out");

    if (!input.productId || !input.locationId) {
      return { success: false, error: "Product and location are required.", code: "VALIDATION_ERROR" };
    }
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      return { success: false, error: "Quantity must be a positive integer.", code: "VALIDATION_ERROR" };
    }

    const movement = await db.$transaction(async (tx) => {
      // Read current stock — lock the row for the duration of the transaction
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_locationId: {
            productId: input.productId,
            locationId: input.locationId,
          },
        },
      });

      const currentQty = inventory?.quantity ?? 0;

      if (currentQty < input.quantity) {
        // Throwing inside the callback rolls back the transaction atomically
        throw new InsufficientStockError(currentQty, input.quantity);
      }

      const newQty = currentQty - input.quantity;

      await tx.inventory.update({
        where: {
          productId_locationId: {
            productId: input.productId,
            locationId: input.locationId,
          },
        },
        data: { quantity: newQty },
      });

      // If this product's stock is now 0, check whether the location is fully empty
      if (newQty === 0) {
        const remaining = await tx.inventory.aggregate({
          where: { locationId: input.locationId, quantity: { gt: 0 } },
          _sum: { quantity: true },
        });
        if ((remaining._sum.quantity ?? 0) === 0) {
          await tx.location.update({
            where: { id: input.locationId },
            data: { status: "AVAILABLE" },
          });
        }
      }

      const isApprover = ["ADMIN", "DIRECTOR", "WAREHOUSE_MANAGER"].includes(session.role);
      const voucherStatus = isApprover ? "APPROVED" : "PENDING";

      return tx.stockMovement.create({
        data: {
          type: "OUT",
          quantity: input.quantity,
          productId: input.productId,
          locationId: input.locationId,
          userId: session.userId,
          voucherStatus,
          approvedBy: isApprover ? session.userId : null,
          approvedAt: isApprover ? new Date() : null,
          note: input.note ?? null,
        },
      });
    });

    revalidatePath("/dashboard/movements");
    revalidatePath("/dashboard/locations");
    return { success: true, data: { movementId: movement.id } };
  } catch (e) {
    if (e instanceof InsufficientStockError) {
      return { success: false, error: e.message, code: e.code };
    }
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
