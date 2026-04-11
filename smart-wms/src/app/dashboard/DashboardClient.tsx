"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { StockBarChart } from "@/components/reports/StockBarChart";
import { MovementLineChart } from "@/components/reports/MovementLineChart";
import type { DashboardStats } from "@/actions/reports/getDashboardStats";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    IN: "bg-green-100 text-green-800 ring-green-200",
    OUT: "bg-red-100 text-red-800 ring-red-200",
    TRANSFER: "bg-blue-100 text-blue-800 ring-blue-200",
  };
  const cls = styles[type] ?? "bg-gray-100 text-gray-700 ring-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${cls}`}
    >
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 ring-yellow-200",
    APPROVED: "bg-green-100 text-green-800 ring-green-200",
    REJECTED: "bg-red-100 text-red-800 ring-red-200",
  };
  const cls = styles[status] ?? "bg-gray-100 text-gray-700 ring-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${cls}`}
    >
      {status}
    </span>
  );
}

export function DashboardClient({ initialData }: { initialData: DashboardStats }) {
  const { t } = useLanguage();
  const { totalProducts, totalLocations, totalStockItems, pendingVouchers, recentMovements, topProducts } = initialData;

  const kpis = [
    {
      label: t("kpi.totalProducts"),
      value: totalProducts.toLocaleString(),
      color: "bg-blue-500",
      icon: (
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      ),
    },
    {
      label: t("kpi.totalLocations"),
      value: totalLocations.toLocaleString(),
      color: "bg-violet-500",
      icon: (
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: t("kpi.totalStock"),
      value: totalStockItems.toLocaleString(),
      color: "bg-emerald-500",
      icon: (
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: t("kpi.pendingVouchers"),
      value: pendingVouchers.toLocaleString(),
      color: pendingVouchers > 0 ? "bg-amber-500" : "bg-gray-400",
      icon: (
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("dashboard.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("dashboard.subtitle")}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${kpi.color}`}>
              {kpi.icon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-gray-500">{kpi.label}</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-gray-900">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-6">{t("dashboard.stockChartTitle")}</h2>
          <StockBarChart data={topProducts} />
        </div>
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-6">{t("dashboard.movementChartTitle")}</h2>
          <MovementLineChart data={recentMovements} />
        </div>
      </div>

      {/* Recent Movements */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">{t("dashboard.recentMovements")}</h2>
          <span className="text-xs text-gray-400">{t("dashboard.last10")}</span>
        </div>

        {recentMovements.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">{t("dashboard.noMovements")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">{t("table.timestamp")}</th>
                  <th className="px-6 py-3">{t("table.type")}</th>
                  <th className="px-6 py-3">{t("table.product")}</th>
                  <th className="px-6 py-3">{t("table.location")}</th>
                  <th className="px-6 py-3 text-right">{t("table.qty")}</th>
                  <th className="px-6 py-3">{t("table.user")}</th>
                  <th className="px-6 py-3">{t("table.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="whitespace-nowrap px-6 py-3 text-gray-500">
                      {formatDate(new Date(m.createdAt))}
                    </td>
                    <td className="px-6 py-3">
                      <TypeBadge type={m.type} />
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-medium text-gray-900">{m.product.name}</span>
                      <span className="ml-1 text-gray-400 text-xs">({m.product.sku})</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-gray-600">
                      {m.location.label}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-right font-semibold tabular-nums text-gray-900">
                      {m.quantity.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-gray-600">{m.user.username}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={m.voucherStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
