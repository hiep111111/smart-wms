"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type CreateTransferInput = {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  note?: string;
};

class InsufficientStockError extends Error {
  readonly code = "INSUFFICIENT_STOCK";
  constructor(available: number, requested: number) {
    super(`Insufficient stock: requested ${requested}, available ${available}.`);
  }
}

export async function createTransfer(
  input: CreateTransferInput
): Promise<ActionResult<{ movementId: string }>> {
  try {
    const session = await requirePermission("inventory:transfer");

    if (!input.productId || !input.fromLocationId || !input.toLocationId) {
      return { success: false, error: "Product and both locations are required.", code: "VALIDATION_ERROR" };
    }
    if (input.fromLocationId === input.toLocationId) {
      return { success: false, error: "Source and destination locations must be different.", code: "SAME_LOCATION" };
    }
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      return { success: false, error: "Quantity must be a positive integer.", code: "VALIDATION_ERROR" };
    }

    const movement = await db.$transaction(async (tx) => {
      // ── Source: read and validate ────────────────────────────────────────────
      const sourceInventory = await tx.inventory.findUnique({
        where: {
          productId_locationId: {
            productId: input.productId,
            locationId: input.fromLocationId,
          },
        },
      });

      const sourceQty = sourceInventory?.quantity ?? 0;
      if (sourceQty < input.quantity) {
        throw new InsufficientStockError(sourceQty, input.quantity);
      }

      // ── Source: decrement ────────────────────────────────────────────────────
      const newSourceQty = sourceQty - input.quantity;
      await tx.inventory.update({
        where: {
          productId_locationId: {
            productId: input.productId,
            locationId: input.fromLocationId,
          },
        },
        data: { quantity: newSourceQty },
      });

      // Update source location status if now empty
      if (newSourceQty === 0) {
        const remaining = await tx.inventory.aggregate({
          where: { locationId: input.fromLocationId, quantity: { gt: 0 } },
          _sum: { quantity: true },
        });
        if ((remaining._sum.quantity ?? 0) === 0) {
          await tx.location.update({
            where: { id: input.fromLocationId },
            data: { status: "AVAILABLE" },
          });
        }
      }

      // ── Destination: upsert ──────────────────────────────────────────────────
      await tx.inventory.upsert({
        where: {
          productId_locationId: {
            productId: input.productId,
            locationId: input.toLocationId,
          },
        },
        create: {
          productId: input.productId,
          locationId: input.toLocationId,
          quantity: input.quantity,
        },
        update: { quantity: { increment: input.quantity } },
      });

      // Destination always has stock now
      await tx.location.update({
        where: { id: input.toLocationId },
        data: { status: "FULL" },
      });

      // ── Single movement record — locationId = destination, fromLocationId = source
      return tx.stockMovement.create({
        data: {
          type: "TRANSFER",
          quantity: input.quantity,
          productId: input.productId,
          locationId: input.toLocationId,
          fromLocationId: input.fromLocationId,
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
    if (e instanceof InsufficientStockError) {
      return { success: false, error: e.message, code: e.code };
    }
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
