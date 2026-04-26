"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import { deleteProduct } from "@/actions/products/deleteProduct";
import type { ProductRow } from "@/actions/products/getProducts";

import { hasPermission } from "@/lib/auth/permissions";

export function ProductsClient({
  initialData,
  session,
}: {
  initialData: ProductRow[];
  session?: any;
}) {
  const { t } = useLanguage();
  const [products, setProducts] = useState(initialData);
  const [deleteProductItem, setDeleteProductItem] = useState<{ id: string; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

  const filteredProducts = products.filter(p => {
    let match = true;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) match = false;
    }
    if (filterCat !== "ALL" && p.category !== filterCat) match = false;
    return match;
  });

  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterCatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCat(e.target.value);
    setCurrentPage(1);
  };

  const canManage = hasPermission(session, "inventory:manage");

  function confirmDelete(id: string, name: string) {
    setDeleteProductItem({ id, name });
  }

  function handleCancelDelete() {
    setDeleteProductItem(null);
  }

  function handleConfirmDelete() {
    if (!deleteProductItem) return;
    startTransition(async () => {
      const result = await deleteProduct(deleteProductItem.id);
      if (!result.success) {
        alert(result.error);
      } else {
        setProducts(products.filter((p) => p.id !== deleteProductItem.id));
      }
      setDeleteProductItem(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <ConfirmModal
        isOpen={!!deleteProductItem}
        title={t("products.delete")}
        message={t("products.deleteConfirm")}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText={isPending ? t("common.deleting") : t("common.delete")}
        isDestructive={true}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("products.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("products.subtitle")}</p>
        </div>
        {canManage && (
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            + {t("products.create")}
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Tìm kiếm Tên SP, SKU..." 
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-9 pr-3 py-2 text-sm w-full sm:w-64 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <select 
            value={filterCat} 
            onChange={handleFilterCatChange} 
            className="text-sm border border-gray-300 rounded p-2 focus:border-blue-500"
          >
            <option value="ALL">Tất cả ngành hàng</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("table.sku")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("table.name")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("table.category")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("table.unit")}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">{t("table.minQty")}</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  {t("table.noProducts")}{" "}
                  <Link href="/dashboard/products/new" className="text-blue-600 hover:underline">
                    {t("table.createOne")}
                  </Link>
                  .
                </td>
              </tr>
            )}
            {paginatedProducts.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-gray-50 h-14">
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{p.sku}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.category ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-gray-600">{p.unit}</td>
                <td className="px-4 py-3 text-gray-600">{p.minQuantity}</td>
                <td className="px-4 py-3 text-right">
                  {canManage && (
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/products/${p.id}`}
                        className="rounded px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                      >
                        {t("common.edit")}
                      </Link>
                      <button
                        onClick={() => confirmDelete(p.id, p.name)}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                      >
                        {t("common.delete")}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredProducts.length > 0 && Array.from({ length: Math.max(0, ITEMS_PER_PAGE - paginatedProducts.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-14">
                <td colSpan={6} className="px-4 py-3 text-transparent">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName={t("products.title").toLowerCase()}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
