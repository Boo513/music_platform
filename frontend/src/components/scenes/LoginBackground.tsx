import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

export function LoginBackground() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={['#0a0a14']} />
        <Stars radius={50} depth={50} count={400} factor={4} saturation={0} fade speed={0.5} />
        <ambientLight intensity={0.3} />
      </Canvas>
    </div>
  );
}
