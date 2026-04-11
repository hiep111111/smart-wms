"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { TransactionForms } from "./TransactionForms";
import type { ProductRow } from "@/actions/products/getProducts";
import type { LocationRow } from "@/actions/locations/getLocations";
import Link from "next/link";

export function ScannerClient({
  products,
  locations,
  session,
}: {
  products: ProductRow[];
  locations: LocationRow[];
  session?: any;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("scanner.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("scanner.subtitle")}
        </p>
      </div>

      {(products.length === 0 || locations.length === 0) && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {products.length === 0 && "No products found. "}
          {locations.length === 0 && "No locations found. "}
          Please create{" "}
          {products.length === 0 && (
            <Link href="/dashboard/products/new" className="underline">
              products
            </Link>
          )}
          {products.length === 0 && locations.length === 0 && " and "}
          {locations.length === 0 && (
            <Link href="/dashboard/locations/new" className="underline">
              locations
            </Link>
          )}{" "}
          before recording movements.
        </div>
      )}

      <TransactionForms products={products} locations={locations} session={session} />
    </div>
  );
}
