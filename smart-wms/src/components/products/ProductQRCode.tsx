"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface Props {
  productId: string;
  className?: string;
  size?: number;
}

export function ProductQRCode({ productId, className = "", size = 120 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, `product:${productId}`, {
        width: size,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      }, (error) => {
        if (error) console.error(error);
      });
    }
  }, [productId, size]);

  return (
    <div className={`inline-block border border-gray-200 rounded-lg p-2 bg-white shadow-sm ${className}`}>
      <canvas ref={canvasRef} />
      <div className="mt-1 text-center text-[10px] text-gray-400 font-mono">CODE</div>
    </div>
  );
}
