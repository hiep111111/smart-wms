"use client";

import { useTransition } from "react";
import { deleteLocation } from "@/actions/locations/deleteLocation";

export function DeleteLocationButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete location "${label}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteLocation(id);
      if (!result.success) {
        alert(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
