"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma/db";
import { requireSession } from "@/lib/auth/checkPermission";
import type { ActionResult } from "@/lib/types";

export type UpdateProfileInput = {
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
};

export async function updateProfile(data: UpdateProfileInput): Promise<ActionResult> {
  try {
    const session = await requireSession();

    await db.user.update({
      where: { id: session.userId },
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        department: data.department,
      },
    });

    revalidatePath("/dashboard/profile");
    return { success: true, data: undefined };
  } catch (e: any) {
    return { success: false, error: e.message || "INTERNAL_ERROR", code: "INTERNAL" };
  }
}
