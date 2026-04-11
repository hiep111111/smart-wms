import { getLocations } from "@/actions/locations/getLocations";
import { LocationsClient } from "./LocationsClient";

import { requireSession } from "@/lib/auth/checkPermission";

export default async function LocationsPage() {
  const session = await requireSession();
  const result = await getLocations();

  return (
    <div className="flex flex-col gap-6">
      {!result.success && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load locations: {result.error}
        </div>
      )}

      {result.success && <LocationsClient initialData={result.data} session={session} />}
    </div>
  );
}
