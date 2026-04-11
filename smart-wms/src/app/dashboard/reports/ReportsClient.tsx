"use client";

import { useState } from "react";
import { type StockReportRow } from "@/actions/reports/getStockReport";
import { exportReport } from "@/actions/reports/exportReport";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ReportsClient({ initialData }: { initialData: StockReportRow[] }) {
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const result = await exportReport();
      if (!result.success) {
        alert("Export failed: " + result.error);
        return;
      }
      if (!result.data) {
        alert("Export failed: No data");
        return;
      }
      
      const { base64, filename } = result.data;
      const url = `data:text/csv;base64,${base64}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert("Error exporting report");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("reports.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("reports.subtitle")}</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {isExporting ? t("reports.exporting") : t("reports.export")}
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">{t("table.sku")}</th>
                <th className="px-6 py-3">{t("table.name")}</th>
                <th className="px-6 py-3">{t("table.category")}</th>
                <th className="px-6 py-3 text-right">{t("table.totalStock")}</th>
                <th className="px-6 py-3 text-right">{t("table.locationCount")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {initialData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                    {t("reports.noData")}
                  </td>
                </tr>
              ) : (
                initialData.map((row) => (
                  <tr key={row.productId} className="hover:bg-gray-50/60 transition-colors">
                    <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-gray-600">
                      {row.sku}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {row.name}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {row.category || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-right font-semibold tabular-nums text-gray-900">
                      {row.totalQuantity.toLocaleString()} {row.unit}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-right text-gray-500">
                      {row.locationCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
