import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function RomanticShape() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.15;
      meshRef.current.rotation.y += delta * 0.25;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <torusKnotGeometry args={[3, 0.8, 200, 32]} />
      <meshPhysicalMaterial
        color="#FF007F"
        emissive="#FF007F"
        emissiveIntensity={0.4}
        roughness={0.2}
        metalness={0.1}
        transparent
        opacity={0.35}
        wireframe
      />
    </mesh>
  );
}
