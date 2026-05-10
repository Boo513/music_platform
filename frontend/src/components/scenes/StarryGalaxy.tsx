import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

export function StarryGalaxy() {
 const groupRef = useRef<THREE.Group>(null);

 useFrame((_, delta) => {
 if (groupRef.current) groupRef.current.rotation.y += delta * 0.02;
 });

 return (
 <group ref={groupRef}>
 <Stars radius={80} depth={60} count={500} factor={4} saturation={0.2} fade speed={0.4} />
 <mesh position={[0, 0, -30]}>
 <sphereGeometry args={[8, 32, 32]} />
 <meshBasicMaterial color="#7c3aed" transparent opacity={0.06} />
 </mesh>
 <mesh position={[0, 0, -30]}>
 <sphereGeometry args={[3, 32, 32]} />
 <meshBasicMaterial color="#a78bfa" transparent opacity={0.12} />
 </mesh>
 </group>
 );
}
