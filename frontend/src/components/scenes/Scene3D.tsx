import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { RomanticShape } from './RomanticShape';
import { useMouseStore } from '@/stores/useMouseStore';

function CameraController() {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 12));
  const currentPos = useRef(new THREE.Vector3(0, 0, 12));

  useFrame((_, delta) => {
    const { x, y } = useMouseStore.getState();
    targetPos.current.set(x * 3, -y * 2, 12);
    currentPos.current.lerp(targetPos.current, delta * 3);
    camera.position.copy(currentPos.current);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export function Scene3D() {
  return (
    <div className="scene-container">
      <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
        <CameraController />
        <color attach="background" args={['#050505']} />
        <Stars radius={60} depth={40} count={500} factor={3} saturation={0} fade speed={0.4} />
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 3, 5]} intensity={2} color="#FF007F" distance={20} />
        <pointLight position={[-5, -2, 3]} intensity={1.5} color="#FFD700" distance={20} />
        <RomanticShape />
      </Canvas>
    </div>
  );
}
