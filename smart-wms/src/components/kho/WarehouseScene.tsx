"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { LocationBlock } from "./LocationBlock";

interface Props {
  locations: any[];
  onSelectLocation: (location: any) => void;
}

export function WarehouseScene({ locations, onSelectLocation }: Props) {
  // Center camera calculation
  const max_x = Math.max(...locations.map(l => l.x), 1);
  const max_y = Math.max(...locations.map(l => l.y), 1);
  const center_x = (max_x * 2.5) / 2;
  const center_z = (max_y * 2.5) / 2;

  return (
    <Canvas 
      camera={{ position: [center_x + 15, 15, center_z + 15], fov: 45 }} 
      className="w-full h-full"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 30, 20]} intensity={1.2} castShadow />
      
      {/* Floor grid */}
      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        cellColor="#e5e7eb" 
        sectionColor="#9ca3af" 
        sectionSize={2.5}
        cellSize={2.5}
        position={[0, -0.01, 0]}
      />
      
      {/* Render Locations */}
      {locations.map((loc) => {
        // Map Database coordinates to 3D Space
        // X = Row (Horizontal) -> mapped to X axis
        // Y = Column (Depth) -> mapped to Z axis
        // Z = Level (Height) -> mapped to Y axis
        const posX = loc.x * 2.5;
        const posZ = loc.y * 2.5; 
        const posY = (loc.z * 1.1) + 0.5; // Add 0.5 so bottom sits exactly on floor
        
        return (
          <LocationBlock 
            key={loc.id} 
            location={loc} 
            position={[posX, posY, posZ]} 
            onClick={onSelectLocation}
          />
        );
      })}
      
      <OrbitControls makeDefault target={[center_x, 0, center_z]} maxPolarAngle={Math.PI / 2 - 0.05} />
      <Environment preset="city" />
    </Canvas>
  );
}
