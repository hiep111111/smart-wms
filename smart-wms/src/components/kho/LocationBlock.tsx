"use client";

import { useState } from "react";
import { Html, Text } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";

interface Props {
  location: any;
  position: [number, number, number];
  onClick: (location: any) => void;
}

export function LocationBlock({ location, position, onClick }: Props) {
  const [hovered, setHover] = useState(false);
  
  // Color configuration based on status
  let color = "#10b981"; // Green = AVAILABLE
  if (location.status === "FULL") color = "#ef4444"; // Red = FULL
  if (location.status === "RESERVED") color = "#f59e0b"; // Amber = RESERVED
  if (location.status === "MAINTENANCE") color = "#6b7280"; // Gray = MAINTENANCE

  return (
    <group position={position}>
      <mesh
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={() => setHover(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(location); }}
      >
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial 
          color={hovered ? "#3b82f6" : color} 
          transparent 
          opacity={hovered ? 0.9 : 0.8} 
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
      
      {/* Permanent Text Label on top of the block */}
      <Text 
        position={[0, 0.51, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        fontSize={0.5} 
        color="#111827" 
        outlineWidth={0.02} 
        outlineColor="#ffffff"
        anchorX="center" 
        anchorY="middle"
      >
        {location.label}
      </Text>
      
      {/* 3D Tooltip Overlay */}
      {hovered && (
        <Html position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-white/95 backdrop-blur rounded-lg shadow-xl p-3 text-xs border border-gray-200 pointer-events-none w-48 transition-all">
            <p className="font-bold text-gray-900 border-b pb-1 mb-2 text-center text-sm">{location.label}</p>
            <div className="grid grid-cols-2 gap-1 mb-1">
              <span className="text-gray-500">Row (X):</span>
              <span className="font-medium text-right text-gray-900">{location.x}</span>
              <span className="text-gray-500">Col (Y):</span>
              <span className="font-medium text-right text-gray-900">{location.y}</span>
              <span className="text-gray-500">Level (Z):</span>
              <span className="font-medium text-right text-gray-900">{location.z}</span>
            </div>
            <div className="mt-2 pt-2 border-t flex justify-between items-center">
              <span className="text-gray-500">Status:</span>
              <span className="font-bold" style={{ color }}>{location.status}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
