import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/stores/useStore';

export function ParticleTunnel() {
  const pointsRef = useRef<THREE.Points>(null);
  const speedsRef = useRef<Float32Array | null>(null);

  const { positions, colors } = useMemo(() => {
    const count = 2500;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const spd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4 + Math.random() * 16;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 120;

      const hue = 0.08 + Math.random() * 0.08;
      const sat = 0.2 + Math.random() * 0.3;
      const light = 0.25 + Math.random() * 0.25;
      const c = new THREE.Color().setHSL(hue, sat, light);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      spd[i] = 0.5 + Math.random() * 1.5;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
    speedsRef.current = spd;
    return { positions: pos, colors: col };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current || !speedsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const spd = speedsRef.current;
    const state = useStore.getState();

    // Smooth lerp currentSpeed to targetSpeed
    const nextSpeed = state.currentSpeed + (state.targetSpeed - state.currentSpeed) * delta * 2;
    useStore.setState({ currentSpeed: nextSpeed });

    const count = 2500;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 2] += spd[i] * nextSpeed * delta * 10;
      if (pos[i * 3 + 2] > 60) {
        pos[i * 3 + 2] = -60;
        const angle = Math.random() * Math.PI * 2;
        const radius = 4 + Math.random() * 16;
        pos[i * 3] = Math.cos(angle) * radius;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Update colors based on accentColor
    const col = pointsRef.current.geometry.attributes.color.array as Float32Array;
    const targetColor = new THREE.Color(state.accentColor);
    for (let i = 0; i < count; i++) {
      const current = new THREE.Color(col[i * 3], col[i * 3 + 1], col[i * 3 + 2]);
      current.lerp(targetColor, delta * 0.3);
      col[i * 3] = current.r;
      col[i * 3 + 1] = current.g;
      col[i * 3 + 2] = current.b;
    }
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={2500}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={2500}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.18}
        vertexColors
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
