"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import Link from "next/link";
import { useState } from "react";
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
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      ),
    },
    {
      id: "locations" as const,
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
      id: "stock" as const,
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
      id: "pending" as const,
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
    <div className="flex flex-col gap-8 relative">
      {/* Filters Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-[500px] border border-gray-100">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-semibold text-lg text-gray-900">Lọc giao dịch</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {/* Note: This is an example layout matching the user request image */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Loại giao dịch</label>
                  <select 
                    value={filterType} 
                    onChange={e => setFilterType(e.target.value)} 
                    className="w-full text-sm border border-gray-300 rounded-md p-2"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="IN">Nhập Kho (IN)</option>
                    <option value="OUT">Xuất Kho (OUT)</option>
                    <option value="TRANSFER">Điều Chuyển (TRANSFER)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái phát hành</label>
                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)} 
                    className="w-full text-sm border border-gray-300 rounded-md p-2"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="PENDING">Chờ Duyệt (PENDING)</option>
                    <option value="APPROVED">Đã Duyệt (APPROVED)</option>
                    <option value="REJECTED">Từ Chối (REJECTED)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-xl">
              <button 
                className="text-sm font-medium text-blue-600 hover:text-blue-700 px-2"
                onClick={() => { setFilterType("ALL"); setFilterStatus("ALL"); }}
              >
                Bộ lọc mặc định
              </button>
              <button 
                className="px-6 py-2 bg-blue-600 text-white font-medium text-sm rounded hover:bg-blue-700" 
                onClick={() => setShowFilterModal(false)}
              >
                Áp dụng
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
                   {activeKpiModal === "products" ? "Tóm tắt: Danh mục Sản phẩm" :
                    activeKpiModal === "locations" ? "Tóm tắt: Vị trí kho" :
                    activeKpiModal === "stock" ? "Tóm tắt: Top tồn kho" : "Tóm tắt: Phiếu chờ duyệt"}
                 </h3>
                 <button onClick={() => setActiveKpiModal(null)} className="text-gray-400 hover:text-gray-600">
                    &times;
                 </button>
              </div>
              <div className="p-4 text-sm text-gray-600 max-h-96 overflow-y-auto">
                 {/* Simulate Dynamic Content */}
                 {activeKpiModal === "products" && (
                    <div>
                      <p className="mb-2">Hệ thống đang quản lý <b>{totalProducts}</b> sản phẩm.</p>
                      {lowStockItems.length > 0 && <p className="text-red-600 font-semibold mb-2">Cảnh báo: Có {lowStockItems.length} sản phẩm sắp hết hàng!</p>}
                      <Link href="/dashboard/products" className="text-blue-600 mt-2 hover:underline">Quản lý toàn bộ danh sách →</Link>
                    </div>
                 )}
                 {activeKpiModal === "locations" && (
                    <div>
                      <p className="mb-2">Có tổng cộng <b>{totalLocations}</b> vị trí được khai báo.</p>
                      <ul className="mb-4 space-y-1">
                        {capacity.map(c => <li key={c.status}>- {c.status}: {c.count} vị trí</li>)}
                      </ul>
                      <Link href="/dashboard/map" className="text-blue-600 hover:underline">Xem sơ đồ 3D →</Link>
                    </div>
                 )}
                 {activeKpiModal === "stock" && (
                    <div>
                      <p className="mb-2">Tổng số lượng vật lý: <b>{totalStockItems}</b> cái/đơn vị.</p>
                      <p className="font-medium mt-4 mb-1">Top Sức chứa:</p>
                      <ul className="list-disc pl-5">
                         {topProducts.map(p => <li key={p.name}>{p.name}: {p.quantity}</li>)}
                      </ul>
                    </div>
                 )}
                 {activeKpiModal === "pending" && (
                    <div>
                      <p className="mb-2">Bạn có <b>{pendingVouchers}</b> phiếu nhập xuất đang chờ Duyệt.</p>
                      <Link href="/dashboard/movements" className="text-blue-600 hover:underline">Đi tới Cổng duyệt →</Link>
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
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
               </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Critical Alerts & Capacity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Low Stock Alerts */}
        <div className="lg:col-span-2 rounded-xl border border-red-100 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-sm font-semibold text-red-900">Low Stock Alerts. Requires immediate restock!</h2>
          </div>
          <div className="p-0 flex-1 overflow-x-auto">
            {lowStockItems.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">All products are well stocked.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">SKU / Product</th>
                    <th className="px-6 py-3 font-medium text-right">Current Qty</th>
                    <th className="px-6 py-3 font-medium text-right">Min Threshold</th>
                    <th className="px-6 py-3 font-medium">Action</th>
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
                        <Link href={`/dashboard/products/${item.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">View Details &rarr;</Link>
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
          <h2 className="text-sm font-semibold text-gray-900 mb-6">Warehouse Capacity</h2>
          
          <div className="w-full h-8 flex rounded-full overflow-hidden mb-6 ring-1 ring-gray-200">
             <div style={{ width: `${getCapacityPct("FULL")}%` }} className="bg-red-500 hover:opacity-90 transition-all cursor-pointer" title="Full"></div>
             <div style={{ width: `${getCapacityPct("RESERVED")}%` }} className="bg-amber-500 hover:opacity-90 transition-all cursor-pointer" title="Reserved"></div>
             <div style={{ width: `${getCapacityPct("AVAILABLE")}%` }} className="bg-emerald-500 hover:opacity-90 transition-all cursor-pointer" title="Available"></div>
             <div style={{ width: `${getCapacityPct("MAINTENANCE")}%` }} className="bg-gray-400 hover:opacity-90 transition-all cursor-pointer" title="Maintenance"></div>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
             <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500"></div><span className="text-gray-600">Full</span></div>
                <span className="font-semibold">{getCapacityPct("FULL").toFixed(1)}%</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500"></div><span className="text-gray-600">Reserved</span></div>
                <span className="font-semibold">{getCapacityPct("RESERVED").toFixed(1)}%</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500"></div><span className="text-gray-600">Available</span></div>
                <span className="font-semibold">{getCapacityPct("AVAILABLE").toFixed(1)}%</span>
             </div>
          </div>
          <Link href="/dashboard/map" className="mt-6 block w-full text-center rounded-md bg-gray-50 py-2 border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Open 3D Map
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
            <span className="text-xs text-gray-400">{filteredMovements.length} giao dịch / {t("dashboard.last10")}</span>
          </div>

          <div className="flex gap-2">
             <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Nhập mã hàng, tên sản phẩm..." 
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Lọc {(filterType !== "ALL" || filterStatus !== "ALL") && <span className="w-2 h-2 rounded-full bg-orange-500 ml-1"></span>}
             </button>
          </div>
        </div>

        {filteredMovements.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">Không tìm thấy giao dịch nào phù hợp với bộ lọc.</p>
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
