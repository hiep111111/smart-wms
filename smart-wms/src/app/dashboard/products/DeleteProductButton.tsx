"use client";

import { useTransition } from "react";
import { deleteProduct } from "@/actions/products/deleteProduct";

export function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteProduct(id);
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
