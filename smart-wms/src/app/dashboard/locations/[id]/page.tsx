import { getLocation } from "@/actions/locations/getLocation";
import { LocationEditClient } from "./LocationEditClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LocationEditPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getLocation(id);

  if (!result.success) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Failed to load location: {result.error}
      </div>
    );
  }
  if (!result.data) return null;

  return <LocationEditClient initialData={result.data} />;
}
