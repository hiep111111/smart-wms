"use client";

import { useState } from "react";
import { Text } from "@react-three/drei";
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
    </group>
  );
}
