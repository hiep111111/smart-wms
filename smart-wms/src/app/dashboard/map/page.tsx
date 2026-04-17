import { getLocations } from "@/actions/locations/getLocations";
import { MapClient } from "./MapClient";

export default async function MapPage() {
  const result = await getLocations();

  if (!result.success) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Failed to load map data: {result.error}
      </div>
    );
  }

  return <MapClient locations={result.data || []} />;
}
