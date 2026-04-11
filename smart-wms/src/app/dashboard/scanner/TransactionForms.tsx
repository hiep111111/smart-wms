"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { createInbound } from "@/actions/inventory/createInbound";
import { createOutbound } from "@/actions/inventory/createOutbound";
import { createTransfer } from "@/actions/inventory/createTransfer";
import type { ProductRow } from "@/actions/products/getProducts";
import type { LocationRow } from "@/actions/locations/getLocations";

type Tab = "IN" | "OUT" | "TRANSFER";

const TABS: { key: Tab; label: string; color: string }[] = [
  { key: "IN",       label: "Goods Receipt (IN)",   color: "green" },
  { key: "OUT",      label: "Goods Issue (OUT)",     color: "red"   },
  { key: "TRANSFER", label: "Transfer",              color: "blue"  },
];

const TAB_ACTIVE: Record<string, string> = {
  green: "border-green-600 text-green-700 bg-green-50",
  red:   "border-red-600 text-red-700 bg-red-50",
  blue:  "border-blue-600 text-blue-700 bg-blue-50",
};

// ── shared select / input styling ──────────────────────────────────────────────
const SELECT_CLS =
  "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50";
const INPUT_CLS =
  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50";
const LABEL_CLS = "block text-sm font-medium text-gray-700 mb-1";

// ── FormField helpers ──────────────────────────────────────────────────────────
function ProductSelect({
  products,
  disabled,
}: {
  products: ProductRow[];
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor="productId" className={LABEL_CLS}>Product *</label>
      <select name="productId" id="productId" required disabled={disabled} className={SELECT_CLS}>
        <option value="">— Select product —</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            [{p.sku}] {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function LocationSelect({
  id,
  label,
  locations,
  disabled,
}: {
  id: string;
  label: string;
  locations: LocationRow[];
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLS}>{label} *</label>
      <select name={id} id={id} required disabled={disabled} className={SELECT_CLS}>
        <option value="">— Select location —</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label} ({l.status})
          </option>
        ))}
      </select>
    </div>
  );
}

function QtyAndNote({ disabled }: { disabled: boolean }) {
  return (
    <>
      <div>
        <label htmlFor="quantity" className={LABEL_CLS}>Quantity *</label>
        <input
          name="quantity"
          id="quantity"
          type="number"
          min="1"
          step="1"
          required
          placeholder="0"
          disabled={disabled}
          className={INPUT_CLS}
        />
      </div>
      <div>
        <label htmlFor="note" className={LABEL_CLS}>Note</label>
        <input
          name="note"
          id="note"
          type="text"
          placeholder="Optional note…"
          disabled={disabled}
          className={INPUT_CLS}
        />
      </div>
    </>
  );
}

function SubmitButton({
  label,
  color,
  loading,
}: {
  label: string;
  color: string;
  loading: boolean;
}) {
  const colorCls: Record<string, string> = {
    green: "bg-green-600 hover:bg-green-700 focus-visible:ring-green-500",
    red:   "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500",
    blue:  "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500",
  };
  return (
    <button
      type="submit"
      disabled={loading}
      className={[
        "inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2",
        "text-sm font-semibold text-white transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        colorCls[color] ?? colorCls.blue,
      ].join(" ")}
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Processing…
        </>
      ) : label}
    </button>
  );
}

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getStockLocationsForProduct, type StockLocationItem } from "@/actions/inventory/getStockLocationsForProduct";
import { useSearchParams } from "next/navigation";
import { hasPermission } from "@/lib/auth/permissions";

// ... [existing imports]
// Note: we can map the tabs dynamically
export function TransactionForms({
  products,
  locations,
  session,
}: {
  products: ProductRow[];
  locations: LocationRow[];
  session?: any;
}) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const urlLocationId = searchParams?.get("locationId") || searchParams?.get("fromLocationId");

  const ALL_TABS: { key: Tab; label: string; color: string; perm: string }[] = [
    { key: "IN",       label: t("scanner.in"),   color: "green", perm: "inventory:in" },
    { key: "OUT",      label: t("scanner.out"),     color: "red", perm: "inventory:out" },
    { key: "TRANSFER", label: t("scanner.transfer"),              color: "blue", perm: "inventory:transfer" },
  ];

  const TABS = ALL_TABS.filter(tab => hasPermission(session, tab.perm));

  const [activeTab, setActiveTab] = useState<Tab>(TABS.length > 0 ? TABS[0].key : "IN");
  const [isPending, startTransition] = useTransition();
  const [isFetchingStock, setIsFetchingStock] = useState(false);
  const [sourceLocations, setSourceLocations] = useState<StockLocationItem[]>([]);
  
  // Keep track of values properly for controlled/uncontrolled state updates
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState(urlLocationId || "");

  const formRef = useRef<HTMLFormElement>(null);

  if (TABS.length === 0) {
    return <div className="p-4 text-red-600 bg-red-50 rounded-md">You do not have permission to perform inventory transactions.</div>;
  }

  function getFormValue(form: HTMLFormElement, name: string) {
    return (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement)?.value ?? "";
  }

  async function handleProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const pid = e.target.value;
    setSelectedProductId(pid);
    if (!pid || activeTab === "IN") {
      setSourceLocations([]);
      if (!urlLocationId) setSelectedSourceId("");
      return;
    }

    setIsFetchingStock(true);
    const res = await getStockLocationsForProduct(pid);
    setIsFetchingStock(false);

    if (res.success && res.data) {
      setSourceLocations(res.data);
      if (!urlLocationId) {
        if (res.data.length === 1) {
          setSelectedSourceId(res.data[0].locationId);
        } else {
          setSelectedSourceId("");
        }
      }
    } else {
      setSourceLocations([]);
      if (!urlLocationId) setSelectedSourceId("");
    }
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    formRef.current?.reset();
    setSelectedProductId("");
    setSourceLocations([]);
    setSelectedSourceId(urlLocationId || "");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    const productId  = getFormValue(form, "productId");
    const quantity   = parseInt(getFormValue(form, "quantity"), 10);
    const note       = getFormValue(form, "note") || undefined;

    startTransition(async () => {
      let result;

      if (activeTab === "IN") {
        const locationId = getFormValue(form, "locationId");
        result = await createInbound({ productId, locationId, quantity, note });
      } else if (activeTab === "OUT") {
        const locationId = selectedSourceId || getFormValue(form, "locationId");
        result = await createOutbound({ productId, locationId, quantity, note });
      } else {
        const fromLocationId = selectedSourceId || getFormValue(form, "fromLocationId");
        const toLocationId   = getFormValue(form, "toLocationId");
        result = await createTransfer({ productId, fromLocationId, toLocationId, quantity, note });
      }

      if (result.success) {
        const labels: Record<Tab, string> = {
          IN: t("common.success"),
          OUT: t("common.success"),
          TRANSFER: t("common.success"),
        };
        toast.success(labels[activeTab]);
        formRef.current?.reset();
        setSelectedProductId("");
        setSourceLocations([]);
        setSelectedSourceId(urlLocationId || "");
      } else {
        if (result.code === "INSUFFICIENT_STOCK") {
          toast.error("Insufficient stock", { description: result.error });
        } else {
          toast.error(t("common.error"), { description: result.error });
        }
      }
    });
  }

  const isSourceLocked = !!urlLocationId || (Boolean(selectedProductId) && sourceLocations.length === 1);
  const isLoadingSource = isPending || isFetchingStock;

  return (
    <div className="max-w-xl">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={[
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? TAB_ACTIVE[tab.color]
                  : "border-transparent text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="productId" className={LABEL_CLS}>{t("scanner.product")} *</label>
            <select 
              name="productId" 
              id="productId" 
              required 
              disabled={isPending} 
              className={SELECT_CLS}
              value={selectedProductId}
              onChange={handleProductChange}
            >
              <option value="">— {t("scanner.selectProduct")} —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* IN: simple destination select */}
          {activeTab === "IN" && (
            <div>
              <label htmlFor="locationId" className={LABEL_CLS}>{t("scanner.toLocation")} *</label>
              <select name="locationId" id="locationId" required disabled={isPending} className={SELECT_CLS}>
                <option value="">— {t("scanner.selectLocation")} —</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label} ({l.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* OUT: source select via smart logic */}
          {activeTab === "OUT" && (
            <div>
              <label htmlFor="locationId" className={LABEL_CLS}>
                {t("scanner.fromLocation")} * 
                {isFetchingStock && <span className="ml-2 text-blue-500 text-xs">...</span>}
                {isSourceLocked && <span className="ml-2 text-gray-400 text-xs">(Auto-selected)</span>}
              </label>
              <select 
                name="locationId" 
                id="locationId" 
                required 
                disabled={isLoadingSource || isSourceLocked} 
                className={`${SELECT_CLS} ${isSourceLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                value={selectedSourceId}
                onChange={(e) => setSelectedSourceId(e.target.value)}
              >
                <option value="">— {t("scanner.selectLocation")} —</option>
                {selectedProductId && !urlLocationId && sourceLocations.length > 0 
                  ? sourceLocations.map((l) => (
                      <option key={l.locationId} value={l.locationId}>
                        {l.label} (Stock: {l.quantity})
                      </option>
                    ))
                  : locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label} ({l.status})
                      </option>
                    ))
                }
              </select>
              {/* Hidden input to ensure value is submitted if disabled */}
              {isSourceLocked && <input type="hidden" name="locationId" value={selectedSourceId} />}
            </div>
          )}

          {/* TRANSFER: source smart, destination simple */}
          {activeTab === "TRANSFER" && (
            <>
              <div>
                <label htmlFor="fromLocationId" className={LABEL_CLS}>
                  {t("scanner.fromLocation")} *
                  {isFetchingStock && <span className="ml-2 text-blue-500 text-xs">...</span>}
                  {isSourceLocked && <span className="ml-2 text-gray-400 text-xs">(Auto-selected)</span>}
                </label>
                <select 
                  name="fromLocationId" 
                  id="fromLocationId" 
                  required 
                  disabled={isLoadingSource || isSourceLocked} 
                  className={`${SELECT_CLS} ${isSourceLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                >
                  <option value="">— {t("scanner.selectLocation")} —</option>
                  {selectedProductId && !urlLocationId && sourceLocations.length > 0
                    ? sourceLocations.map((l) => (
                        <option key={l.locationId} value={l.locationId}>
                          {l.label} (Stock: {l.quantity})
                        </option>
                      ))
                    : locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.label} ({l.status})
                        </option>
                      ))
                  }
                </select>
                {isSourceLocked && <input type="hidden" name="fromLocationId" value={selectedSourceId} />}
              </div>
              <div>
                <label htmlFor="toLocationId" className={LABEL_CLS}>{t("scanner.toLocation")} *</label>
                <select name="toLocationId" id="toLocationId" required disabled={isPending} className={SELECT_CLS}>
                  <option value="">— {t("scanner.selectLocation")} —</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label} ({l.status})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label htmlFor="quantity" className={LABEL_CLS}>{t("scanner.quantity")} *</label>
            <input name="quantity" id="quantity" type="number" min="1" step="1" required placeholder="0" disabled={isPending} className={INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="note" className={LABEL_CLS}>{t("scanner.note")}</label>
            <input name="note" id="note" type="text" placeholder="..." disabled={isPending} className={INPUT_CLS} />
          </div>

          <SubmitButton
            label={isPending ? t("scanner.submitting") : t("scanner.submit")}
            color={TABS.find((t) => t.key === activeTab)?.color ?? "blue"}
            loading={isPending}
          />
        </form>
      </div>
    </div>
  );
}
