"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type CreateProductInput = {
  sku: string;
  name: string;
  category?: string;
  unit?: string;
  description?: string;
  minQuantity?: number;
};

function isPrismaUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}

export async function createProduct(
  input: CreateProductInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("inventory:manage");

    const { sku, name, category, unit, description, minQuantity } = input;

    if (!sku.trim() || !name.trim()) {
      return { success: false, error: "SKU and name are required.", code: "VALIDATION_ERROR" };
    }

    const product = await db.product.create({
      data: {
        sku: sku.trim(),
        name: name.trim(),
        category: category?.trim() || null,
        unit: unit?.trim() || "Cái",
        description: description?.trim() || null,
        minQuantity: minQuantity ?? 0,
      },
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: { id: product.id } };
  } catch (e) {
    if (isPrismaUniqueError(e)) {
      return { success: false, error: "SKU already exists.", code: "DUPLICATE_SKU" };
    }
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
