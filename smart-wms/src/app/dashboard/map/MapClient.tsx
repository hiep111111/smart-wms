"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { WarehouseScene } from "@/components/kho/WarehouseScene";
import { useState } from "react";
import Link from "next/link";
import { LocationQRCode } from "@/components/locations/LocationQRCode";
import { MousePointerClick } from "lucide-react";

export function MapClient({ locations }: { locations: any[] }) {
  const { t } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-4">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("nav.map") || "3D Map"}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("map.subtitle")}
          </p>
        </div>
        <div className="flex gap-4 items-center text-sm font-medium">
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> {t("map.available")}</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> {t("map.full")}</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> {t("map.reserved")}</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-500"></span> {t("map.maintenance")}</div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* 3D Map Viewport */}
        <div className="flex-1 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden shadow-inner relative group cursor-grab active:cursor-grabbing">
          {locations.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
              <span className="text-gray-400">{t("map.noLocations")}</span>
              <Link href="/dashboard/locations/new" className="text-blue-500 underline text-sm">{t("map.createFirst")}</Link>
            </div>
          ) : (
            <WarehouseScene locations={locations} onSelectLocation={setSelectedLocation} />
          )}
          <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
            {t("map.instructions")}
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">{t("map.inspectorTitle")}</h3>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {!selectedLocation ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-3">
                  <MousePointerClick className="w-12 h-12 text-gray-200" />
                  <p className="text-sm">{t("map.inspectorEmpty")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("map.label")}</h4>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{selectedLocation.label}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500 block">{t("map.status")}</span>
                      <span className={`font-bold mt-1 block ${
                        selectedLocation.status === 'AVAILABLE' ? 'text-emerald-600' :
                        selectedLocation.status === 'FULL' ? 'text-red-600' :
                        selectedLocation.status === 'RESERVED' ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        {selectedLocation.status === 'AVAILABLE' ? t("locations.statusAvailable") :
                         selectedLocation.status === 'FULL' ? t("locations.statusFull") :
                         selectedLocation.status === 'RESERVED' ? t("locations.statusReserved") :
                         selectedLocation.status === 'MAINTENANCE' ? t("locations.statusMaintenance") : selectedLocation.status}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500 block">{t("map.coordinates")}</span>
                      <span className="font-mono text-gray-900 mt-1 block tracking-widest">{selectedLocation.x},{selectedLocation.y},{selectedLocation.z}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("map.quickActions")}</h4>
                    <div className="flex flex-col gap-2">
                      <Link 
                        href={`/dashboard/locations/${selectedLocation.id}`}
                        className="w-full text-center py-2 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        {t("map.editDetails")}
                      </Link>
                      <Link 
                        href={`/dashboard/scanner?locationId=${selectedLocation.id}`}
                        className="w-full text-center py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors shadow-sm"
                      >
                        {t("map.createTransaction")}
                      </Link>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
                     <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{t("map.qrCode")}</span>
                     <LocationQRCode locationId={selectedLocation.id} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
