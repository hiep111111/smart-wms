import { getStockReport } from "@/actions/reports/getStockReport";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const result = await getStockReport();

  if (!result.success) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          Failed to load reports: {result.error}
        </div>
      </div>
    );
  }

  return <ReportsClient initialData={result.data || []} />;
}
