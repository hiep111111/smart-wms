import { getDashboardStats } from "@/actions/reports/getDashboardStats";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const result = await getDashboardStats();

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          Failed to load dashboard: {result.error}
        </div>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          Failed to load dashboard: No data returned
        </div>
      </div>
    );
  }

  return <DashboardClient initialData={result.data} />;
}
