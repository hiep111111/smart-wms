import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getLocations } from "@/actions/kho/getLocations";
import { WarehouseMap } from "@/components/kho/WarehouseMap";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const locations = await getLocations();

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Sơ đồ Kho hàng</h1>
          <p className="mt-1 text-sm text-slate-400">
            Grid 5×10 — 5 dãy kệ (X) × 10 kệ (Y) × 2 tầng (Z). Click ô để xem chi tiết.
          </p>
        </div>

        {/* Legend */}
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500 bg-emerald-500/20 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-400">Trống</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-red-500 bg-red-500/20 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-xs font-medium text-red-400">Đầy</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-amber-500 bg-amber-500/20 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-xs font-medium text-amber-400">Đang xử lý</span>
          </div>
        </div>

        {/* Map */}
        <div className="relative ml-8 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          {/* Y-axis labels */}
          <div className="absolute -left-7 top-0 grid h-full" style={{ gridTemplateRows: `repeat(10, 1fr)` }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((y) => (
              <div key={y} className="flex items-center justify-end pr-1 text-xs text-slate-500">
                Y{y}
              </div>
            ))}
          </div>
          <WarehouseMap locations={locations} />
        </div>

        <p className="mt-4 text-right text-xs text-slate-600">
          Xin chào, {session.role}
        </p>
      </div>
    </div>
  );
}
