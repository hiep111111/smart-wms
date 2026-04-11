"use server";

import { db } from "@/lib/prisma/db";
import { requirePermission } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";
import { Prisma } from "@prisma/client";

export async function updateLocation(
  id: string,
  data: {
    label: string;
    x: number;
    y: number;
    z: number;
    status: string;
  }
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission("locations:manage");

    // check collision
    const collision = await db.location.findFirst({
      where: {
        x: data.x,
        y: data.y,
        z: data.z,
        NOT: { id },
      },
    });

    if (collision) {
      return {
        success: false,
        error: `Location already exists at coordinates (${data.x}, ${data.y}, ${data.z})`,
        code: "COLLISION",
      };
    }

    const updated = await db.location.update({
      where: { id },
      data: {
        label: data.label.trim(),
        x: data.x,
        y: data.y,
        z: data.z,
        status: data.status,
      },
    });

    return { success: true, data: { id: updated.id } };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return { success: false, error: "Location label is already in use", code: "UNIQUE_VIOLATION" };
      }
      if (e.code === "P2025") {
        return { success: false, error: "Location not found", code: "NOT_FOUND" };
      }
    }
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
