"use client";

import { useState } from "react";
import type { LocationWithInventory } from "@/actions/kho/getLocations";

type CellStatus = "AVAILABLE" | "FULL" | "RESERVED";

const STATUS_PRIORITY: Record<CellStatus, number> = {
  AVAILABLE: 0,
  RESERVED: 1,
  FULL: 2,
};

const STATUS_STYLES: Record<CellStatus, { bg: string; border: string; text: string; dot: string }> = {
  AVAILABLE: {
    bg: "bg-emerald-500/20",
    border: "border-emerald-500",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  RESERVED: {
    bg: "bg-amber-500/20",
    border: "border-amber-500",
    text: "text-amber-400",
    dot: "bg-amber-500",
  },
  FULL: {
    bg: "bg-red-500/20",
    border: "border-red-500",
    text: "text-red-400",
    dot: "bg-red-500",
  },
};

const STATUS_LABELS: Record<CellStatus, string> = {
  AVAILABLE: "Trống",
  RESERVED: "Đang xử lý",
  FULL: "Đầy",
};

function worstStatus(statuses: string[]): CellStatus {
  let worst: CellStatus = "AVAILABLE";
  for (const s of statuses) {
    const status = s as CellStatus;
    if ((STATUS_PRIORITY[status] ?? 0) > STATUS_PRIORITY[worst]) {
      worst = status;
    }
  }
  return worst;
}

type CellData = {
  x: number;
  y: number;
  compositeStatus: CellStatus;
  zLevels: Map<number, LocationWithInventory>;
};

function buildGrid(locations: LocationWithInventory[]): CellData[][] {
  const cellMap = new Map<string, CellData>();

  for (const loc of locations) {
    const key = `${loc.x}-${loc.y}`;
    if (!cellMap.has(key)) {
      cellMap.set(key, { x: loc.x, y: loc.y, compositeStatus: "AVAILABLE", zLevels: new Map() });
    }
    cellMap.get(key)!.zLevels.set(loc.z, loc);
  }

  for (const cell of cellMap.values()) {
    const statuses = Array.from(cell.zLevels.values()).map((l) => l.status);
    cell.compositeStatus = worstStatus(statuses);
  }

  // Build rows Y=1..10, cols X=1..5
  const rows: CellData[][] = [];
  for (let y = 1; y <= 10; y++) {
    const row: CellData[] = [];
    for (let x = 1; x <= 5; x++) {
      const cell = cellMap.get(`${x}-${y}`);
      row.push(cell ?? { x, y, compositeStatus: "AVAILABLE", zLevels: new Map() });
    }
    rows.push(row);
  }
  return rows;
}

type ModalProps = {
  cell: CellData;
  onClose: () => void;
};

function LocationModal({ cell, onClose }: ModalProps) {
  const zLevels = Array.from(cell.zLevels.entries()).sort(([a], [b]) => a - b);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
          aria-label="Đóng"
        >
          ✕
        </button>

        <h2 className="mb-4 text-lg font-bold text-white">
          Dãy X{cell.x} — Kệ Y{cell.y}
        </h2>

        {zLevels.length === 0 ? (
          <p className="text-slate-400">Không có dữ liệu tầng.</p>
        ) : (
          <div className="space-y-4">
            {zLevels.map(([z, loc]) => {
              const styles = STATUS_STYLES[loc.status as CellStatus] ?? STATUS_STYLES.AVAILABLE;
              return (
                <div key={z} className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">Tầng Z{z}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles.bg} ${styles.text} border ${styles.border}`}
                    >
                      {STATUS_LABELS[loc.status as CellStatus] ?? loc.status}
                    </span>
                  </div>

                  {loc.stocks.length === 0 ? (
                    <p className="text-xs text-slate-500">Trống — chưa có hàng</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-400">
                          <th className="pb-1 pr-2">SKU</th>
                          <th className="pb-1 pr-2">Tên sản phẩm</th>
                          <th className="pb-1 pr-2 text-right">SL</th>
                          <th className="pb-1 text-right">ĐV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loc.stocks.map((stock) => (
                          <tr key={stock.id} className="text-slate-300">
                            <td className="py-0.5 pr-2 font-mono">{stock.product.sku}</td>
                            <td className="py-0.5 pr-2">{stock.product.name}</td>
                            <td className="py-0.5 pr-2 text-right">{stock.quantity}</td>
                            <td className="py-0.5 text-right">{stock.product.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

type WarehouseMapProps = {
  locations: LocationWithInventory[];
};

export function WarehouseMap({ locations }: WarehouseMapProps) {
  const [selectedCell, setSelectedCell] = useState<CellData | null>(null);
  const grid = buildGrid(locations);

  return (
    <>
      {/* Column headers */}
      <div className="mb-1 grid grid-cols-5 gap-2 px-0">
        {[1, 2, 3, 4, 5].map((x) => (
          <div key={x} className="text-center text-xs font-semibold text-slate-400">
            Dãy X{x}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {grid.map((row) =>
          row.map((cell) => {
            const styles = STATUS_STYLES[cell.compositeStatus];

            return (
              <button
                key={`${cell.x}-${cell.y}`}
                onClick={() => setSelectedCell(cell)}
                className={`group relative flex flex-col items-center justify-center gap-1 rounded-lg border p-2 transition-all hover:brightness-125 ${styles.bg} ${styles.border}`}
                title={`X${cell.x}-Y${cell.y}: ${STATUS_LABELS[cell.compositeStatus]}`}
              >
                <span className={`text-xs font-semibold ${styles.text}`}>
                  X{cell.x}-Y{cell.y}
                </span>
                <div className="flex gap-1">
                  {[1, 2].map((z) => {
                    const loc = cell.zLevels.get(z);
                    const dotStyles = loc
                      ? STATUS_STYLES[loc.status as CellStatus]?.dot ?? "bg-slate-600"
                      : "bg-slate-600";
                    return (
                      <span
                        key={z}
                        className={`h-2 w-2 rounded-full ${dotStyles}`}
                        title={`Z${z}: ${loc ? (STATUS_LABELS[loc.status as CellStatus] ?? loc.status) : "N/A"}`}
                      />
                    );
                  })}
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedCell && (
        <LocationModal cell={selectedCell} onClose={() => setSelectedCell(null)} />
      )}
    </>
  );
}
