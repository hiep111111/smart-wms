"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { updateLocation } from "@/actions/locations/updateLocation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";

export function LocationEditClient({ initialData }: { initialData: any }) {
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
    const getValue = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement)?.value;

    const data = {
      label: getValue("label"),
      x: Number(getValue("x")),
      y: Number(getValue("y")),
      z: Number(getValue("z")),
      status: getValue("status"),
    };

    if (!data.label.trim()) {
      setError("Label is required.");
      return;
    }
    if ([data.x, data.y, data.z].some((v) => !Number.isInteger(v) || v < 0)) {
      setError("X, Y, Z must be non-negative integers.");
      return;
    }

    setFormData(data);
    setShowConfirm(true);
  }

  function handleConfirmSave() {
    setShowConfirm(false);
    startTransition(async () => {
      const result = await updateLocation(initialData.id, formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(t("common.success"));
      router.push("/dashboard/locations");
      router.refresh(); // Invalidate cache to show updated data
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <ConfirmModal
        isOpen={showConfirm}
        title={t("locations.edit")}
        message={t("common.areYouSure") || "Are you sure you want to save changes?"}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
        confirmText={t("common.save")}
        isDestructive={false}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/locations" className="text-sm text-gray-500 hover:text-gray-700">
          ← {t("locations.title")}
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{t("locations.edit")}</h1>
      </div>

      <div className="max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label={`${t("locations.label")} *`}
            name="label"
            id="label"
            required
            defaultValue={initialData.label}
            disabled={isPending}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label={`${t("table.x")} *`}
              name="x"
              id="x"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={initialData.x}
              disabled={isPending}
            />
            <Input
              label={`${t("table.y")} *`}
              name="y"
              id="y"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={initialData.y}
              disabled={isPending}
            />
            <Input
              label={`${t("table.z")} *`}
              name="z"
              id="z"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={initialData.z}
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
              {t("locations.status")} *
            </label>
            <select
              name="status"
              id="status"
              required
              disabled={isPending}
              defaultValue={initialData.status}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="AVAILABLE">{t("locations.statusAvailable")}</option>
              <option value="FULL">{t("locations.statusFull")}</option>
              <option value="RESERVED">{t("locations.statusReserved")}</option>
              <option value="MAINTENANCE">{t("locations.statusMaintenance")}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={isPending} className="flex-1">
              {isPending ? t("common.saving") : t("common.save")}
            </Button>
            <Link href="/dashboard/locations">
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
