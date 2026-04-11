import { getProducts } from "@/actions/products/getProducts";
import { ProductsClient } from "./ProductsClient";

import { requireSession } from "@/lib/auth/checkPermission";

export default async function ProductsPage() {
  const session = await requireSession();
  const result = await getProducts();

  return (
    <div className="flex flex-col gap-6">
      {!result.success && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load products: {result.error}
        </div>
      )}

      {result.success && <ProductsClient initialData={result.data} session={session} />}
    </div>
  );
}
