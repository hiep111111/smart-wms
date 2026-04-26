"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProduct } from "@/actions/products/createProduct";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowLeft } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement).value;

    const input = {
      sku: getValue("sku"),
      name: getValue("name"),
      category: getValue("category"),
      unit: getValue("unit") || "Cái",
      minQuantity: Number(getValue("minQuantity")) || 0,
    };

    startTransition(async () => {
      const result = await createProduct(input);
      if (!result.success) {
        setError(
          result.code === "DUPLICATE_SKU"
            ? `SKU "${input.sku}" already exists. Please use a different SKU.`
            : result.error
        );
        return;
      }
      router.push("/dashboard/products");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/products"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> {t("products.title")}
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{t("products.create")}</h1>
      </div>

      <div className="max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={`${t("products.sku")} *`}
            name="sku"
            id="sku"
            required
            placeholder="e.g. IP-15-PRO"
            disabled={isPending}
          />
          <Input
            label={`${t("products.name")} *`}
            name="name"
            id="name"
            required
            placeholder="e.g. iPhone 15 Pro Max"
            disabled={isPending}
          />
          <Input
            label={t("products.category")}
            name="category"
            id="category"
            placeholder="e.g. Electronics"
            disabled={isPending}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("products.unit")}
              name="unit"
              id="unit"
              placeholder="Cái"
              disabled={isPending}
            />
            <Input
              label={t("products.minQty")}
              name="minQuantity"
              id="minQuantity"
              type="number"
              min="0"
              placeholder="0"
              disabled={isPending}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isPending}
              className="flex-1"
            >
              {isPending ? t("common.saving") : t("products.create")}
            </Button>
            <Link href="/dashboard/products">
              <Button type="button" variant="secondary" disabled={isPending}>
                {t("common.cancel")}
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
