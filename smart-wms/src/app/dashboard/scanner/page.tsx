import { getProducts } from "@/actions/products/getProducts";
import { getLocations } from "@/actions/locations/getLocations";
import { ScannerClient } from "./ScannerClient";

import { requireSession } from "@/lib/auth/checkPermission";

export default async function ScannerPage() {
  const session = await requireSession();
  const productsRes = await getProducts();
  const locationsRes = await getLocations();

  if (!productsRes.success || !locationsRes.success) {
    return (
      <div className="p-6 text-red-600">
        Error loading transaction dependencies.
      </div>
    );
  }

  return (
    <ScannerClient 
      products={productsRes.data || []} 
      locations={locationsRes.data || []} 
      session={session} 
    />
  );
}
