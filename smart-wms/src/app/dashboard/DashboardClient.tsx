"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import Link from "next/link";
import { useState } from "react";
import { StockBarChart } from "@/components/reports/StockBarChart";
import { MovementLineChart } from "@/components/reports/MovementLineChart";
import type { DashboardStats } from "@/actions/reports/getDashboardStats";
import { 
  Package, 
  MapPin, 
  Boxes, 
  Clock, 
  X, 
  Search, 
  Filter, 
  ChevronRight, 
  AlertTriangle 
} from "lucide-react";

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
  const { totalProducts, totalLocations, totalStockItems, pendingVouchers, recentMovements, topProducts, capacity = [], lowStockItems = [] } = initialData;

  const totalCapacity = capacity.reduce((acc, c) => acc + c.count, 0) || 1; // avoid div by 0
  
  function getCapacityPct(status: string) {
    const count = capacity.find(c => c.status === status)?.count || 0;
    return (count / totalCapacity) * 100;
  }

  // --- Filtering State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const filteredMovements = recentMovements.filter(m => {
    let match = true;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!m.product.name.toLowerCase().includes(q) && 
          !m.product.sku.toLowerCase().includes(q) && 
          !m.user.username.toLowerCase().includes(q)) match = false;
    }
    if (filterType !== "ALL" && m.type !== filterType) match = false;
    if (filterStatus !== "ALL" && m.voucherStatus !== filterStatus) match = false;
    return match;
  });

  // --- KPI Modal State ---
  const [activeKpiModal, setActiveKpiModal] = useState<"products" | "locations" | "stock" | "pending" | null>(null);

  const kpis = [
    {
      id: "products" as const,
      label: t("kpi.totalProducts"),
      value: totalProducts.toLocaleString(),
      color: "bg-blue-500",
      icon: (
        <Package className="h-6 w-6 text-white" />
      ),
    },
    {
      id: "locations" as const,
      label: t("kpi.totalLocations"),
      value: totalLocations.toLocaleString(),
      color: "bg-violet-500",
      icon: (
        <MapPin className="h-6 w-6 text-white" />
      ),
    },
    {
      id: "stock" as const,
      label: t("kpi.totalStock"),
      value: totalStockItems.toLocaleString(),
      color: "bg-emerald-500",
      icon: (
        <Boxes className="h-6 w-6 text-white" />
      ),
    },
    {
      id: "pending" as const,
      label: t("kpi.pendingVouchers"),
      value: pendingVouchers.toLocaleString(),
      color: pendingVouchers > 0 ? "bg-amber-500" : "bg-gray-400",
      icon: (
        <Clock className="h-6 w-6 text-white" />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8 relative">
      {/* Filters Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-[500px] border border-gray-100">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-semibold text-lg text-gray-900">{t("dashboard.filterTransactions")}</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {/* Note: This is an example layout matching the user request image */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t("dashboard.transactionType")}</label>
                  <select 
                    value={filterType} 
                    onChange={e => setFilterType(e.target.value)} 
                    className="w-full text-sm border border-gray-300 rounded-md p-2"
                  >
                    <option value="ALL">{t("dashboard.all")}</option>
                    <option value="IN">{t("dashboard.in")}</option>
                    <option value="OUT">{t("dashboard.out")}</option>
                    <option value="TRANSFER">{t("dashboard.transfer")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t("dashboard.issueStatus")}</label>
                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)} 
                    className="w-full text-sm border border-gray-300 rounded-md p-2"
                  >
                    <option value="ALL">{t("dashboard.all")}</option>
                    <option value="PENDING">{t("dashboard.pending")}</option>
                    <option value="APPROVED">{t("dashboard.approved")}</option>
                    <option value="REJECTED">{t("dashboard.rejected")}</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-xl">
              <button 
                className="text-sm font-medium text-blue-600 hover:text-blue-700 px-2"
                onClick={() => { setFilterType("ALL"); setFilterStatus("ALL"); }}
              >
                {t("dashboard.defaultFilter")}
              </button>
              <button 
                className="px-6 py-2 bg-blue-600 text-white font-medium text-sm rounded hover:bg-blue-700" 
                onClick={() => setShowFilterModal(false)}
              >
                {t("dashboard.apply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Tóm Tắt (Summary) Modal */}
      {activeKpiModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
              <div className="flex justify-between items-center p-4 border-b">
                 <h3 className="font-semibold text-lg text-gray-900">
                   {activeKpiModal === "products" ? t("dashboard.summaryProducts") :
                    activeKpiModal === "locations" ? t("dashboard.summaryLocations") :
                    activeKpiModal === "stock" ? t("dashboard.summaryStock") : t("dashboard.summaryPending")}
                 </h3>
                 <button onClick={() => setActiveKpiModal(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="p-4 text-sm text-gray-600 max-h-96 overflow-y-auto">
                 {/* Simulate Dynamic Content */}
                 {activeKpiModal === "products" && (
                    <div>
                      <p className="mb-2">{t("dashboard.systemManaging")} <b>{totalProducts}</b> {t("dashboard.productsPlural")}</p>
                      {lowStockItems.length > 0 && <p className="text-red-600 font-semibold mb-2">{t("dashboard.alertLowStockPart1")} {lowStockItems.length} {t("dashboard.alertLowStockPart2")}</p>}
                      <Link href="/dashboard/products" className="text-blue-600 mt-2 hover:underline">{t("dashboard.manageAllList")}</Link>
                    </div>
                 )}
                 {activeKpiModal === "locations" && (
                    <div>
                      <p className="mb-2">{t("dashboard.totalLocationsCount")} <b>{totalLocations}</b> {t("dashboard.locationsDeclared")}</p>
                      <ul className="mb-4 space-y-1">
                        {capacity.map(c => <li key={c.status}>- {c.status}: {c.count} {t("dashboard.locationsPlural")}</li>)}
                      </ul>
                      <Link href="/dashboard/map" className="text-blue-600 hover:underline">{t("dashboard.view3DMap")}</Link>
                    </div>
                 )}
                 {activeKpiModal === "stock" && (
                    <div>
                      <p className="mb-2">{t("dashboard.totalPhysicalQty")} <b>{totalStockItems}</b> {t("dashboard.itemsUnits")}</p>
                      <p className="font-medium mt-4 mb-1">{t("dashboard.topCapacity")}</p>
                      <ul className="list-disc pl-5">
                         {topProducts.map(p => <li key={p.name}>{p.name}: {p.quantity}</li>)}
                      </ul>
                    </div>
                 )}
                 {activeKpiModal === "pending" && (
                    <div>
                      <p className="mb-2">{t("dashboard.pendingVouchersPart1")} <b>{pendingVouchers}</b> {t("dashboard.pendingVouchersPart2")}</p>
                      <Link href="/dashboard/movements" className="text-blue-600 hover:underline">{t("dashboard.goToApproval")}</Link>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("dashboard.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("dashboard.subtitle")}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            onClick={() => setActiveKpiModal(kpi.id)}
            className="flex items-center text-left gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:ring-2 hover:ring-blue-500 hover:border-blue-500 transition-all cursor-pointer group"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${kpi.color}`}>
              {kpi.icon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-gray-500 group-hover:text-blue-600 transition-colors">{kpi.label}</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-gray-900">{kpi.value}</p>
            </div>
            <div className="ml-auto text-gray-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100">
               <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        ))}
      </div>

      {/* Critical Alerts & Capacity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Low Stock Alerts */}
        <div className="lg:col-span-2 rounded-xl border border-red-100 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-sm font-semibold text-red-900">{t("dashboard.lowStockAlerts")}</h2>
          </div>
          <div className="p-0 flex-1 overflow-x-auto">
            {lowStockItems.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">{t("dashboard.allStocked")}</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">{t("dashboard.skuProduct")}</th>
                    <th className="px-6 py-3 font-medium text-right">{t("dashboard.currentQty")}</th>
                    <th className="px-6 py-3 font-medium text-right">{t("dashboard.minThreshold")}</th>
                    <th className="px-6 py-3 font-medium">{t("dashboard.action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lowStockItems.map(item => (
                    <tr key={item.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{item.sku}</div>
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-red-600">{item.currentQty}</td>
                      <td className="px-6 py-3 text-right text-gray-500">{item.minQty}</td>
                      <td className="px-6 py-3">
                        <Link href={`/dashboard/products/${item.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">{t("dashboard.viewDetails")}</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Warehouse Capacity */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6 flex flex-col">
          <h2 className="text-sm font-semibold text-gray-900 mb-6">{t("dashboard.warehouseCapacity")}</h2>
          
          <div className="w-full h-8 flex rounded-full overflow-hidden mb-6 ring-1 ring-gray-200">
             <div style={{ width: `${getCapacityPct("FULL")}%` }} className="bg-red-500 hover:opacity-90 transition-all cursor-pointer" title={t("dashboard.full")}></div>
             <div style={{ width: `${getCapacityPct("RESERVED")}%` }} className="bg-amber-500 hover:opacity-90 transition-all cursor-pointer" title={t("dashboard.reserved")}></div>
             <div style={{ width: `${getCapacityPct("AVAILABLE")}%` }} className="bg-emerald-500 hover:opacity-90 transition-all cursor-pointer" title={t("dashboard.available")}></div>
             <div style={{ width: `${getCapacityPct("MAINTENANCE")}%` }} className="bg-gray-400 hover:opacity-90 transition-all cursor-pointer" title={t("dashboard.maintenance")}></div>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
             <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500"></div><span className="text-gray-600">{t("dashboard.full")}</span></div>
                <span className="font-semibold">{getCapacityPct("FULL").toFixed(1)}%</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500"></div><span className="text-gray-600">{t("dashboard.reserved")}</span></div>
                <span className="font-semibold">{getCapacityPct("RESERVED").toFixed(1)}%</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500"></div><span className="text-gray-600">{t("dashboard.available")}</span></div>
                <span className="font-semibold">{getCapacityPct("AVAILABLE").toFixed(1)}%</span>
             </div>
          </div>
          <Link href="/dashboard/map" className="mt-6 block w-full text-center rounded-md bg-gray-50 py-2 border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            {t("dashboard.open3DMap")}
          </Link>
        </div>
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

      {/* Recent Movements with Advanced Filters */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 px-6 pb-4 gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{t("dashboard.recentMovements")}</h2>
            <span className="text-xs text-gray-400">{filteredMovements.length} {t("dashboard.transactionCount")} {t("dashboard.last10")}</span>
          </div>

          <div className="flex gap-2">
             <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                   <Search className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={t("dashboard.searchPlaceholder")} 
                  className="pl-9 pr-3 py-1.5 text-sm w-64 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
             </div>
             <button 
               onClick={() => setShowFilterModal(true)}
               className={`flex items-center gap-2 px-3 py-1.5 border rounded text-sm font-medium transition-colors ${
                 (filterType !== "ALL" || filterStatus !== "ALL") 
                    ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" 
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
               }`}
             >
                <Filter className="w-4 h-4" />
                {t("dashboard.filter")} {(filterType !== "ALL" || filterStatus !== "ALL") && <span className="w-2 h-2 rounded-full bg-orange-500 ml-1"></span>}
             </button>
          </div>
        </div>

        {filteredMovements.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">{t("dashboard.noFilterMatch")}</p>
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
                {filteredMovements.map((m) => (
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
