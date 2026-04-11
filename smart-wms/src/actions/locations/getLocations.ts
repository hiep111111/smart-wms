"use server";

import { db } from "@/lib/prisma/db";
import { requireSession } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type LocationRow = {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  status: string;
  createdAt: Date;
};

export async function getLocations(): Promise<ActionResult<LocationRow[]>> {
  try {
    await requireSession();

    const locations = await db.location.findMany({
      orderBy: [{ x: "asc" }, { y: "asc" }, { z: "asc" }],
      select: {
        id: true,
        label: true,
        x: true,
        y: true,
        z: true,
        status: true,
        createdAt: true,
      },
    });

    return { success: true, data: locations };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "INTERNAL_ERROR";
    return { success: false, error: msg, code: msg };
  }
}
