import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleTunnel } from './ParticleTunnel';
import { useStore } from '@/stores/useStore';

function CameraController() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame(({ camera }) => {
    const { mouseX, mouseY } = useStore.getState();
    const targetRotX = mouseY * 0.15;
    const targetRotY = mouseX * 0.2;
    camera.rotation.x += (targetRotX - camera.rotation.x) * 0.03;
    camera.rotation.y += (targetRotY - camera.rotation.y) * 0.03;
  });

  return null;
}

export function HomeScene3D() {
  return (
    <div className="home-canvas-container">
      <Canvas camera={{ position: [0, 0, 0], fov: 75, near: 0.5, far: 200 }}>
        <color attach="background" args={['#050508']} />
        <CameraController />
        <fog attach="fog" args={['#050508', 50, 150]} />
        <ParticleTunnel />
      </Canvas>
    </div>
  );
}
