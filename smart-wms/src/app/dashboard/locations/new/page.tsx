"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createLocation } from "@/actions/locations/createLocation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowLeft } from "lucide-react";

export default function NewLocationPage() {
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
      label: getValue("label"),
      x: Number(getValue("x")),
      y: Number(getValue("y")),
      z: Number(getValue("z")),
    };

    if (!input.label.trim()) {
      setError("Label is required.");
      return;
    }
    if ([input.x, input.y, input.z].some((v) => !Number.isInteger(v) || v < 0)) {
      setError("X, Y, Z must be non-negative integers.");
      return;
    }

    startTransition(async () => {
      const result = await createLocation(input);
      if (!result.success) {
        setError(
          result.code === "DUPLICATE_LABEL"
            ? `Label "${input.label}" is already in use. Choose a different label.`
            : result.error
        );
        return;
      }
      router.push("/dashboard/locations");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/locations"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> {t("locations.title")}
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{t("locations.create")}</h1>
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
            label={`${t("locations.label")} *`}
            name="label"
            id="label"
            required
            placeholder="e.g. A01-S01-T01"
            disabled={isPending}
            helperText="A unique identifier for this storage slot"
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
              placeholder="0"
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
              placeholder="0"
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
              placeholder="0"
              disabled={isPending}
            />
          </div>

          <p className="text-xs text-gray-400">
            X, Y, Z define the 3D coordinate of this location in the warehouse map.
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isPending}
              className="flex-1"
            >
              {isPending ? t("common.saving") : t("locations.create")}
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
