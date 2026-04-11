"use server";

import { getStockReport } from "./getStockReport";

export async function exportReport() {
  const result = await getStockReport();
  
  if (!result.success) {
    return { success: false, error: result.error };
  }

  if (!result.data) {
    return { success: false, error: "Failed to fetch report data" };
  }

  // Create a CSV string
  const header = ["SKU", "Product Name", "Category", "Total Stock", "Location Count"].join(",");
  const rows = result.data.map(r => 
    [
      `"${r.sku.replace(/"/g, '""')}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${(r.category || "").replace(/"/g, '""')}"`,
      r.totalQuantity,
      r.locationCount
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  const base64 = Buffer.from(csv, "utf-8").toString("base64");

  return { success: true, data: { base64, filename: `stock-report-${new Date().toISOString().split('T')[0]}.csv` } };
}
