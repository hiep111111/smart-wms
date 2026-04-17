"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { deleteLocation } from "@/actions/locations/deleteLocation";
import type { LocationRow } from "@/actions/locations/getLocations";
import { hasPermission } from "@/lib/auth/permissions";

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  FULL: "bg-red-100 text-red-700",
  RESERVED: "bg-yellow-100 text-yellow-700",
  MAINTENANCE: "bg-gray-100 text-gray-700",
  DEFAULT: "bg-gray-100 text-gray-600",
};

export function LocationsClient({
  initialData,
  session,
}: {
  initialData: LocationRow[];
  session?: any;
}) {
  const { t } = useLanguage();
  const [locations, setLocations] = useState(initialData);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLabel, setDeleteLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filteredLocations = locations.filter(loc => {
    let match = true;
    if (searchTerm && !loc.label.toLowerCase().includes(searchTerm.toLowerCase())) match = false;
    if (filterStatus !== "ALL" && loc.status !== filterStatus) match = false;
    return match;
  });

  const canManage = hasPermission(session, "locations:manage");

  function triggerDelete(id: string, label: string) {
    setDeleteId(id);
    setDeleteLabel(label);
  }

  function handleCancelDelete() {
    setDeleteId(null);
  }

  function handleConfirmDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteLocation(deleteId);
      if (!result.success) {
        alert(result.error);
      } else {
        setLocations(locations.filter((loc) => loc.id !== deleteId));
      }
      setDeleteId(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <ConfirmModal
        isOpen={!!deleteId}
        title={t("locations.delete")}
        message={t("locations.deleteConfirm")}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText={isPending ? t("common.deleting") : t("common.delete")}
        isDestructive={true}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("locations.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("locations.subtitle")}</p>
        </div>
        {canManage && (
          <Link
            href="/dashboard/locations/new"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            + {t("locations.create")}
          </Link>
        )}
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
            placeholder="Tìm mã vị trí..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm w-full sm:w-64 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)} 
            className="text-sm border border-gray-300 rounded p-2 focus:border-blue-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="AVAILABLE">AVAILABLE (Trống)</option>
            <option value="FULL">FULL (Đầy)</option>
            <option value="RESERVED">RESERVED (Đã đặt)</option>
            <option value="MAINTENANCE">MAINTENANCE (Bảo trì)</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("locations.label")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("table.x")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("table.y")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("table.z")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("table.status")}</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {locations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  {t("table.noLocations")}{" "}
                  {canManage && (
                    <Link href="/dashboard/locations/new" className="text-blue-600 hover:underline">
                      {t("table.createOne")}
                    </Link>
                  )}
                  .
                </td>
              </tr>
            )}
            {filteredLocations.map((loc) => {
              const style = STATUS_STYLES[loc.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.DEFAULT;
              let statusLabel = loc.status;
              if (loc.status === "AVAILABLE") statusLabel = t("locations.statusAvailable");
              if (loc.status === "FULL") statusLabel = t("locations.statusFull");
              if (loc.status === "MAINTENANCE") statusLabel = t("locations.statusMaintenance");
              if (loc.status === "RESERVED") statusLabel = t("locations.statusReserved") || "Reserved";

              return (
                <tr key={loc.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{loc.label}</td>
                  <td className="px-4 py-3 text-gray-600">{loc.x}</td>
                  <td className="px-4 py-3 text-gray-600">{loc.y}</td>
                  <td className="px-4 py-3 text-gray-600">{loc.z}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManage && (
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/locations/${loc.id}`}
                          className="rounded px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          {t("common.edit")}
                        </Link>
                        <button
                          onClick={() => triggerDelete(loc.id, loc.label)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
          Hiển thị {filteredLocations.length} / {locations.length} {t("locations.title").toLowerCase()}
        </div>
      </div>
    </div>
  );
}
