"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { WarehouseScene } from "@/components/kho/WarehouseScene";
import { useState } from "react";
import Link from "next/link";
import { LocationQRCode } from "@/components/locations/LocationQRCode";

export function MapClient({ locations }: { locations: any[] }) {
  const { t } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-4">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("nav.map") || "3D Map"}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Interactive 3D visualization of your warehouse layout.
          </p>
        </div>
        <div className="flex gap-4 items-center text-sm font-medium">
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Available</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Full</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Reserved</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-500"></span> Maint.</div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* 3D Map Viewport */}
        <div className="flex-1 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden shadow-inner relative group cursor-grab active:cursor-grabbing">
          {locations.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
              <span className="text-gray-400">No locations found.</span>
              <Link href="/dashboard/locations/new" className="text-blue-500 underline text-sm">Create coordinates first</Link>
            </div>
          ) : (
            <WarehouseScene locations={locations} onSelectLocation={setSelectedLocation} />
          )}
          <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
            Drag to rotate • Scroll to zoom • Right-click to pan
          </div>
        </div>

        {/* Sidebar Info Panel */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Location Inspector</h3>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {!selectedLocation ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-3">
                  <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <p className="text-sm">Click any block on the 3D map to inspect its details.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Label</h4>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">{selectedLocation.label}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500 block">Status</span>
                      <span className={`font-bold mt-1 block ${
                        selectedLocation.status === 'AVAILABLE' ? 'text-emerald-600' :
                        selectedLocation.status === 'FULL' ? 'text-red-600' :
                        selectedLocation.status === 'RESERVED' ? 'text-amber-600' : 'text-gray-600'
                      }`}>{selectedLocation.status}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500 block">Coordinates</span>
                      <span className="font-mono text-gray-900 mt-1 block tracking-widest">{selectedLocation.x},{selectedLocation.y},{selectedLocation.z}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h4>
                    <div className="flex flex-col gap-2">
                      <Link 
                        href={`/dashboard/locations/${selectedLocation.id}`}
                        className="w-full text-center py-2 px-4 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        Edit Location Details
                      </Link>
                      <Link 
                        href={`/dashboard/scanner?locationId=${selectedLocation.id}`}
                        className="w-full text-center py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors shadow-sm"
                      >
                        Create Transaction Here
                      </Link>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
                     <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Location QR Code</span>
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
