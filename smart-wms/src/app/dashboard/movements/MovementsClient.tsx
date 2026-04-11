"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { MovementRow } from "@/actions/inventory/getMovements";
import Link from "next/link";

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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("movements.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("movements.subtitle")}</p>
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
            {initialData.map((m) => {
              const type = TYPE_STYLES[m.type] ?? { cls: "bg-gray-100 text-gray-600" };
              const translatedType = m.type === "IN" ? t("scanner.in") : m.type === "OUT" ? t("scanner.out") : t("scanner.transfer");
              
              const locationLabel = m.type === "TRANSFER"
                ? `${m.fromLocation?.label ?? "?"} → ${m.location.label}`
                : m.location.label;

              return (
                <tr key={m.id} className="transition-colors hover:bg-gray-50">
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
          </tbody>
        </table>
        <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
          {initialData.length} records
        </div>
      </div>
    </div>
  );
}
