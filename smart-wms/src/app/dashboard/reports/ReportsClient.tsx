"use client";

import { useState } from "react";
import { type StockReportRow } from "@/actions/reports/getStockReport";
import { exportReport } from "@/actions/reports/exportReport";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ReportsClient({ initialData }: { initialData: StockReportRow[] }) {
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");

  const categories = Array.from(new Set(initialData.map(r => r.category).filter(Boolean))) as string[];

  const filteredData = initialData.filter(r => {
    let match = true;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !r.sku.toLowerCase().includes(q)) match = false;
    }
    if (filterCat !== "ALL" && r.category !== filterCat) match = false;
    return match;
  });

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

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Tìm kiếm Tên SP, SKU..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm w-full sm:w-64 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <select 
            value={filterCat} 
            onChange={e => setFilterCat(e.target.value)} 
            className="text-sm border border-gray-300 rounded p-2 focus:border-blue-500"
          >
            <option value="ALL">Tất cả ngành hàng</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
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
                filteredData.map((row) => (
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
        <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400 bg-gray-50">
          Hiển thị {filteredData.length} / {initialData.length} dòng dữ liệu
        </div>
      </div>
    </div>
  );
}
