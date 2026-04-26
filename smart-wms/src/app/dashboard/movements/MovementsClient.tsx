"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { MovementRow } from "@/actions/inventory/getMovements";
import Link from "next/link";
import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";

const TYPE_STYLES: Record<string, { cls: string }> = {
  IN:       { cls: "bg-green-100 text-green-700" },
  OUT:      { cls: "bg-red-100 text-red-700" },
  TRANSFER: { cls: "bg-blue-100 text-blue-700" },
};

function formatDate(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MovementsClient({ initialData }: { initialData: MovementRow[] }) {
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const filteredMovements = initialData.filter(m => {
    let match = true;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!m.product.name.toLowerCase().includes(q) &&
          !m.product.sku.toLowerCase().includes(q) &&
          !m.user.username.toLowerCase().includes(q)) match = false;
    }
    if (filterType !== "ALL" && m.type !== filterType) match = false;
    return match;
  });

  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE);
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("movements.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("movements.subtitle")}</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder="Tìm mã SP, SKU, Người dùng..." 
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-9 pr-3 py-2 text-sm w-full sm:w-64 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <select 
            value={filterType} 
            onChange={handleFilterTypeChange} 
            className="text-sm border border-gray-300 rounded p-2 focus:border-blue-500"
          >
            <option value="ALL">Tất cả loại giao dịch</option>
            <option value="IN">Nhập Kho (IN)</option>
            <option value="OUT">Xuất Kho (OUT)</option>
            <option value="TRANSFER">Điều Chuyển (TRANSFER)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{t("table.timestamp")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("table.type")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("table.product")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("table.location")}</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">{t("table.qty")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("table.user")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("scanner.note")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialData.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  {t("movements.noMovements")}
                  <Link href="/dashboard/scanner" className="text-blue-600 hover:underline inline pl-1">
                    {t("nav.transactions")}
                  </Link>
                </td>
              </tr>
            )}
            {paginatedMovements.map((m) => {
              const type = TYPE_STYLES[m.type] ?? { cls: "bg-gray-100 text-gray-600" };
              const translatedType = m.type === "IN" ? t("scanner.in") : m.type === "OUT" ? t("scanner.out") : t("scanner.transfer");
              
              const locationLabel = m.type === "TRANSFER"
                ? (
                  <span className="flex items-center gap-1">
                    {m.fromLocation?.label ?? "?"} <ArrowRight className="w-3 h-3" /> {m.location.label}
                  </span>
                )
                : m.location.label;

              return (
                <tr key={m.id} className="transition-colors hover:bg-gray-50 h-16">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(new Date(m.createdAt))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={["inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", type.cls].join(" ")}>
                      {translatedType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{m.product.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{m.product.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                    {locationLabel}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900">
                    {m.type === "OUT" ? "-" : "+"}
                    {m.quantity}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {m.user.username}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                    {m.note ?? "—"}
                  </td>
                </tr>
              );
            })}
            {filteredMovements.length > 0 && Array.from({ length: Math.max(0, ITEMS_PER_PAGE - paginatedMovements.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-16">
                <td colSpan={7} className="px-4 py-3 text-transparent">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMovements.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredMovements.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName={t("scanner.title").toLowerCase()}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
