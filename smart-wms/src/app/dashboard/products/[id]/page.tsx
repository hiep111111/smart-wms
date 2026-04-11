import { getProduct } from "@/actions/products/getProduct";
import { ProductEditClient } from "./ProductEditClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductEditPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getProduct(id);

  if (!result.success) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Failed to load product: {result.error}
      </div>
    );
  }
  if (!result.data) return null;

  return <ProductEditClient initialData={result.data} />;
}
