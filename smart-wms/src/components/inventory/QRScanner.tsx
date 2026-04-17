"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Props {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: Props) {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scannerId = "wms-qr-reader";
    
    // Initialize scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      scannerId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    html5QrcodeScanner.render(
      (text) => {
        // Stop scanning after success
        html5QrcodeScanner.clear().catch(console.error);
        onScan(text);
      },
      (err) => {
        // Continuous scan error, usually safe to ignore during scanning
      }
    );

    // Cleanup when component unmounts
    return () => {
      try {
        html5QrcodeScanner.clear().catch(() => {});
      } catch (e) {
        // Ignore unmount error
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col items-center">
        <div className="flex items-center justify-between w-full p-4 border-b">
          <h3 className="font-semibold text-gray-900">{t("scanner.title") || "Scan QR Code"}</h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 w-full">
          <div id="wms-qr-reader" className="w-full"></div>
          {error && <p className="mt-2 text-sm font-medium text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
