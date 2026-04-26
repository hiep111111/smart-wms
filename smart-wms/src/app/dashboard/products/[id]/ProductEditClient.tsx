"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { updateProduct } from "@/actions/products/updateProduct";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import { ProductQRCode } from "@/components/products/ProductQRCode";
import { ArrowLeft } from "lucide-react";

export function ProductEditClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const getValue = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value;

    setFormData({
      name: getValue("name"),
      category: getValue("category"),
      unit: getValue("unit") || "Cái",
      minQuantity: Number(getValue("minQuantity")) || 0,
      maxQuantity: Number(getValue("maxQuantity")) || 0,
      description: getValue("description"),
    });
    
    setShowConfirm(true);
  }

  function handleConfirmSave() {
    setShowConfirm(false);
    startTransition(async () => {
      const result = await updateProduct(initialData.id, formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(t("common.success"));
      router.push("/dashboard/products");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <ConfirmModal
        isOpen={showConfirm}
        title={t("products.edit")}
        message={t("common.areYouSure") || "Are you sure you want to save changes?"}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
        confirmText={t("common.save")}
        isDestructive={false}
      />

      <div className="flex items-center gap-3">
        <Link href="/dashboard/products" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          {t("products.title")}
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{t("products.edit")}</h1>
      </div>

      <div className="max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                label={`${t("products.sku")} (Read-only)`}
                name="sku"
                id="sku"
                defaultValue={initialData.sku}
                disabled={true}
              />
            </div>
            <div className="shrink-0 pb-1">
              <ProductQRCode productId={initialData.id} size={80} />
            </div>
          </div>
          <Input
            label={`${t("products.name")} *`}
            name="name"
            id="name"
            required
            defaultValue={initialData.name}
            disabled={isPending}
          />
          <Input
            label={t("products.category")}
            name="category"
            id="category"
            defaultValue={initialData.category || ""}
            disabled={isPending}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("products.unit")}
              name="unit"
              id="unit"
              defaultValue={initialData.unit}
              disabled={isPending}
            />
            <Input
              label={t("products.minQty")}
              name="minQuantity"
              id="minQuantity"
              type="number"
              min="0"
              defaultValue={initialData.minQuantity}
              disabled={isPending}
            />
          </div>
          <Input
            label={t("products.maxQty")}
            name="maxQuantity"
            id="maxQuantity"
            type="number"
            min="0"
            defaultValue={initialData.maxQuantity || ""}
            disabled={isPending}
          />
          <Input
            label={t("products.description")}
            name="description"
            id="description"
            defaultValue={initialData.description || ""}
            disabled={isPending}
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={isPending} className="flex-1">
              {isPending ? t("common.saving") : t("common.save")}
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
