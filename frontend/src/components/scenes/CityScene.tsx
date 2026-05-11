import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

function RotatingShapes() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.05;
  });
  return (
    <group ref={groupRef}>
      <mesh position={[30, 15, -50]}>
        <icosahedronGeometry args={[8, 1]} />
        <meshStandardMaterial color="#FF8C42" roughness={0.2} metalness={0.3} emissive="#FF6B00" emissiveIntensity={0.3} wireframe />
      </mesh>
      <mesh position={[-25, -10, -60]}>
        <torusKnotGeometry args={[6, 1.5, 100, 16]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.15} metalness={0.5} emissive="#5b21b6" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, -20, -40]} rotation={[0, 0, 0]}>
        <ringGeometry args={[20, 22, 64]} />
        <meshBasicMaterial color="#FFB366" side={THREE.DoubleSide} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function GroundGrid() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -30, -40]}>
      <planeGeometry args={[300, 300, 30, 30]} />
      <meshBasicMaterial color="#FF8C42" wireframe transparent opacity={0.06} />
    </mesh>
  );
}

export function CityScene() {
  return (
    <>
      <color attach="background" args={['#0a0a18']} />
      <fog attach="fog" args={['#0a0a18', 60, 300]} />
      <Stars radius={150} depth={80} count={260} factor={2} saturation={0.15} fade speed={0.25} />
      <ambientLight intensity={0.3} color="#3a3060" />
      <pointLight position={[50, 30, -40]} intensity={2} color="#FF8C42" distance={200} />
      <pointLight position={[-40, 20, -60]} intensity={1.5} color="#7c3aed" distance={150} />
      <RotatingShapes />
      <GroundGrid />
    </>
  );
}
