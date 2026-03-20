"use server";
import { db } from "@/lib/prisma/db";

export type LocationWithInventory = {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  status: string;
  stocks: {
    id: string;
    quantity: number;
    product: {
      id: string;
      sku: string;
      name: string;
      unit: string;
    };
  }[];
};

export async function getLocations(): Promise<LocationWithInventory[]> {
  return db.location.findMany({
    include: { stocks: { include: { product: true } } },
    orderBy: [{ x: "asc" }, { y: "asc" }, { z: "asc" }],
  });
}
