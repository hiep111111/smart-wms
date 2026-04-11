import { getMovements } from "@/actions/inventory/getMovements";
import { MovementsClient } from "./MovementsClient";

export default async function MovementsPage() {
  const result = await getMovements();

  return (
    <div className="flex flex-col gap-6">
      {!result.success && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load movements: {result.error}
        </div>
      )}

      {result.success && <MovementsClient initialData={result.data} />}
    </div>
  );
}
