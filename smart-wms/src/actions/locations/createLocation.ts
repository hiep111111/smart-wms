"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type CreateLocationInput = {
  label: string;
  x: number;
  y: number;
  z: number;
};

function isPrismaUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}

export async function createLocation(
  input: CreateLocationInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("locations:manage");

    const { label, x, y, z } = input;

    if (!label.trim()) {
      return { success: false, error: "Label is required.", code: "VALIDATION_ERROR" };
    }

    const location = await db.location.create({
      data: {
        label: label.trim(),
        x: Math.floor(x),
        y: Math.floor(y),
        z: Math.floor(z),
        status: "AVAILABLE",
      },
    });

    revalidatePath("/dashboard/locations");
    return { success: true, data: { id: location.id } };
  } catch (e) {
    if (isPrismaUniqueError(e)) {
      return {
        success: false,
        error: "A location with this label already exists.",
        code: "DUPLICATE_LABEL",
      };
    }
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
