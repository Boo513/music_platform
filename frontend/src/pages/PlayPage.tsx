import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';
import { songsApi } from '@/api/songs';
import { TopIcons } from '@/components/layout/TopIcons';
import { RightControls } from '@/components/layout/RightControls';
import { RadioPanel } from '@/components/layout/RadioPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import type { Song } from '@/types';

const DEMO_SONG: Song = {
  id: 0, title: 'India TOP 100', artist: 'Cheema Y, Gur Sidhu & Jasmeen Akhtar',
  coverUrl: null, duration: 222, style: 'electronic', mood: 'excited', playCount: 12801,
  isFavorited: false, uploader: { id: 1, nickname: 'Demo' }, createdAt: new Date().toISOString(),
};

// ===== SKY DOME =====
function SkyDome() {
  const uniforms = useMemo(() => ({
    topC: { value: new THREE.Color('#152238') },
    midC: { value: new THREE.Color('#2a4560') },
    horC: { value: new THREE.Color('#c47a5a') },
    glowC: { value: new THREE.Color('#FF9B55') },
  }), []);
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[500, 64, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader="varying vec3 vWPos; void main() { vec4 wp = modelMatrix * vec4(position,1.0); vWPos = wp.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }"
        fragmentShader="uniform vec3 topC,midC,horC,glowC; varying vec3 vWPos; void main() { float h = normalize(vWPos+400.0).y; vec3 c; if(h>0.6) c=mix(midC,topC,smoothstep(0.6,1.0,h)); else if(h>0.25) c=mix(horC,midC,smoothstep(0.25,0.6,h)); else if(h>-0.15) c=mix(glowC,horC,smoothstep(-0.15,0.25,h)); else c=glowC; gl_FragColor=vec4(c,1.0); }"
        side={THREE.BackSide} depthWrite={false}
      />
    </mesh>
  );
}

// ===== GROUND =====
function Ground() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#2d3a4f'; ctx.fillRect(0, 0, 2048, 2048);
    for (let i = 0; i < 8000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
      ctx.fillRect(Math.random() * 2048, Math.random() * 2048, 2, 2);
    }
    const ppu = 2048 / 2000;
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 5 * ppu;
    for (let x = 1024 % Math.round(24 * ppu); x < 2048; x += 24 * ppu) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 2048); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(2048, x); ctx.stroke();
    }
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2.2 * ppu;
    for (let x = 1024 % Math.round(12 * ppu); x < 2048; x += 12 * ppu) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 2048); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(2048, x); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return tex;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[2000, 2000]} />
      <meshStandardMaterial map={texture} roughness={0.7} metalness={0.05} color="#ffffff" />
    </mesh>
  );
}

// ===== LIGHTHOUSE =====
function Lighthouse() {
  const beamRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!beamRef.current) return;
    const t = clock.getElapsedTime();
    beamRef.current.rotation.y += 0.0015;
    beamRef.current.scale.setScalar(1 + Math.sin(t * 1.3) * 0.05);
  });
  const deg5 = (5 * Math.PI) / 180;

  return (
    <group position={[0, 0, -40]}>
      {/* Base */}
      {[{ r: [12, 14], h: 2, y: 1 }, { r: [10, 12], h: 2, y: 3 }, { r: [8, 10], h: 1.5, y: 4.5 }].map((b, i) => (
        <mesh key={i} position={[0, b.y, 0]} castShadow>
          <cylinderGeometry args={[b.r[0], b.r[1], b.h, 48]} />
          <meshStandardMaterial color={['#4a5568', '#3d4556', '#5a6578'][i]} roughness={0.9} />
        </mesh>
      ))}
      {/* Glass tower */}
      {[[6, 8, 8, 9], [4.5, 6, 6, 16], [5, 4.5, 4, 21]].map(([rt, rb, h, y], i) => (
        <mesh key={`t${i}`} position={[0, y, 0]} castShadow>
          <cylinderGeometry args={[rt as number, rb as number, h as number, 48]} />
          <meshPhysicalMaterial color="#FF8C42" roughness={0.1} emissive="#FF6B35" emissiveIntensity={0.15} transparent opacity={0.45} />
        </mesh>
      ))}
      {/* Chamber */}
      <mesh position={[0, 23.5, 0]}>
        <cylinderGeometry args={[6, 5, 1.5, 48]} />
        <meshStandardMaterial color="#FFB366" roughness={0.2} emissive="#FFB366" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 25.5, 0]}>
        <cylinderGeometry args={[5, 6, 3, 48]} />
        <meshPhysicalMaterial color="#FFE4B5" roughness={0.05} emissive="#FFB366" emissiveIntensity={0.5} transparent opacity={0.45} />
      </mesh>
      <mesh position={[0, 29.5, 0]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 28, 0]}>
        <coneGeometry args={[5.5, 2, 48]} />
        <meshStandardMaterial color="#FF8C42" roughness={0.2} emissive="#FF8C42" emissiveIntensity={0.7} />
      </mesh>
      {/* Lights */}
      <pointLight position={[0, 29.5, 0]} color="#FF8C42" intensity={1.8} distance={300} />
      <pointLight position={[0, 1.5, 0]} color="#FFB366" intensity={0.6} distance={40} />
      {/* Beam */}
      <group ref={beamRef} position={[0, 29.5, 0]} rotation={[deg5, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 50]}>
          <coneGeometry args={[1, 100, 32, 8, true]} />
          <meshBasicMaterial color="#FFE4B5" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

// ===== PARTICLES =====
function Particles() {
  const dustRef = useRef<THREE.Points>(null);
  const ffRef = useRef<THREE.Points>(null);
  const bpRef = useRef<THREE.Points>(null);

  const { dustGeom, dustVel, ffGeom, ffPhase, bpGeom, bpProg } = useMemo(() => {
    const dGeom = new THREE.BufferGeometry();
    const dPos = new Float32Array(250 * 3);
    const dVel = new Float32Array(250 * 3);
    for (let i = 0; i < 250; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * 400;
      dPos[i * 3 + 1] = 5 + Math.random() * 60;
      dPos[i * 3 + 2] = (Math.random() - 0.5) * 400 - 40;
      dVel[i * 3] = (Math.random() - 0.5) * 0.2;
      dVel[i * 3 + 1] = -0.05 - Math.random() * 0.15;
      dVel[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    dGeom.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    const fGeom = new THREE.BufferGeometry();
    const fPos = new Float32Array(20 * 3);
    const fPhase = new Float32Array(20);
    for (let i = 0; i < 20; i++) {
      fPos[i * 3] = (Math.random() - 0.5) * 120;
      fPos[i * 3 + 1] = 3 + Math.random() * 20;
      fPos[i * 3 + 2] = (Math.random() - 0.5) * 120 - 40;
      fPhase[i] = Math.random() * Math.PI * 2;
    }
    fGeom.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
    const bGeom = new THREE.BufferGeometry();
    const bPos = new Float32Array(70 * 3);
    const bProg = new Float32Array(70);
    for (let i = 0; i < 70; i++) {
      bProg[i] = Math.random();
      bPos[i * 3] = (Math.random() - 0.5) * 2;
      bPos[i * 3 + 1] = 29.5;
      bPos[i * 3 + 2] = bProg[i] * 100;
    }
    bGeom.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
    return { dustGeom: dGeom, dustVel: dVel, ffGeom: fGeom, ffPhase: fPhase, bpGeom: bGeom, bpProg: bProg };
  }, []);

  const lastT = useRef(0);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dt = Math.min(t - (lastT.current || t), 0.1);
    lastT.current = t;

    if (dustRef.current) {
      const dPos = dustGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < 250; i++) {
        dPos[i * 3] += dustVel[i * 3] * dt * 10;
        dPos[i * 3 + 1] += dustVel[i * 3 + 1] * dt * 10;
        dPos[i * 3 + 2] += dustVel[i * 3 + 2] * dt * 10;
        if (Math.abs(dPos[i * 3]) > 200) dPos[i * 3] *= -0.9;
        if (dPos[i * 3 + 1] < 2) dPos[i * 3 + 1] = 55;
        if (dPos[i * 3 + 1] > 60) dPos[i * 3 + 1] = 2;
      }
      dustGeom.attributes.position.needsUpdate = true;
    }
    if (ffRef.current) {
      const fA = ffGeom.attributes.position;
      for (let i = 0; i < 20; i++) {
        fA.setZ(i, 0 + Math.sin(t * 1.8 + ffPhase[i]) * 3);
        fA.setY(i, 5 + Math.sin(t * 1.2 + ffPhase[i]) * 2);
        fA.setX(i, 0 + Math.cos(t * 1.5 + ffPhase[i]) * 4);
      }
      fA.needsUpdate = true;
    }
    if (bpRef.current) {
      const bA = bpGeom.attributes.position;
      for (let i = 0; i < 70; i++) {
        bpProg[i] = (bpProg[i] + dt * 0.08) % 1;
        bA.setZ(i, bpProg[i] * 100);
        bA.setY(i, 29.5 + bpProg[i] * 4);
      }
      bA.needsUpdate = true;
    }
  });

  return (
    <>
      <points ref={dustRef} geometry={dustGeom}>
        <pointsMaterial color="#475569" size={0.25} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
      <points ref={ffRef} geometry={ffGeom}>
        <pointsMaterial color="#bfdbfe" size={0.35} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
      <points ref={bpRef} geometry={bpGeom} position={[0, 0, -40]}>
        <pointsMaterial color="#FFE4B5" size={0.3} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
    </>
  );
}

// ===== BUILDINGS =====
function Buildings() {
  const instancedRef = useRef<THREE.Group>(null);
  useEffect(() => {
    if (!instancedRef.current) return;
    const group = instancedRef.current;
    const hash = (x: number, z: number) => Math.sin(x * 12.9898 + z * 78.233) * 43758.5453 - Math.floor(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453);
    const isRoad = (x: number, z: number) => {
      const mx = ((x % 24) + 24) % 24, mz = ((z % 24) + 24) % 24;
      if (mx < 2.5 || mx > 21.5 || mz < 2.5 || mz > 21.5) return true;
      const nx = ((x % 12) + 12) % 12, nz = ((z % 12) + 12) % 12;
      return nx < 1.2 || nx > 10.8 || nz < 1.2 || nz > 10.8;
    };
    const matDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    const matMid = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const matGlass = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, emissive: 0xFFE4B5, emissiveIntensity: 0.08 });
    for (let x = -200; x <= 200; x += 3) {
      for (let z = -200; z <= 200; z += 3) {
        if (Math.sqrt(x * x + z * z) > 200) continue;
        if (isRoad(x, z)) continue;
        if (hash(x * 0.05, z * 0.05) > 0.65) continue;
        if (Math.sqrt(x * x + (z + 40) * (z + 40)) < 22) continue;
        const n = hash(x * 0.03, z * 0.03);
        const bh = 1 + n * 4, bw = 1.5 + n * 3, bd = 1.5 + hash(z * 0.05, x * 0.05) * 3;
        const mat = n < 0.3 ? matDark : n < 0.6 ? matMid : matGlass;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
        mesh.position.set(x, bh / 2, z);
        mesh.castShadow = true;
        group.add(mesh);
      }
    }
    return () => { while (group.children.length) group.remove(group.children[0]); };
  }, []);
  return <group ref={instancedRef} />;
}

// ===== MAIN SCENE =====
function Scene3D() {
  return (
    <>
      <SkyDome />
      <fog attach="fog" args={['#e07840', 120, 550]} />
      <ambientLight intensity={0.55} color="#3a5070" />
      <hemisphereLight intensity={0.55} color="#4a6080" groundColor="#FF8C42" />
      <directionalLight position={[50, 100, 50]} intensity={0.25} color="#8899aa" />
      <Stars radius={150} depth={80} count={300} factor={3} saturation={0.2} fade speed={0.5} />
      <Ground />
      <Buildings />
      <Lighthouse />
      <Particles />
    </>
  );
}

export default function PlayPage() {
  const { songId } = useParams<{ songId: string }>();
  const { isPlaying, pause, resume } = usePlayerStore();
  const [demoSong, setDemoSong] = useState<Song | null>(null);

  useEffect(() => {
    if (songId) {
      songsApi.getById(Number(songId)).then(() => {}).catch(() => setDemoSong(DEMO_SONG));
    }
  }, [songId]);

  const song = demoSong || DEMO_SONG;

  return (
    <div className="fixed inset-0" style={{ background: '#0a0a18' }}>
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 5, 50], fov: 60 }}>
          <Scene3D />
        </Canvas>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <TopIcons
            isFavorited={false}
            onToggleFavorite={() => {}}
            onOpenSettings={() => {}}
            isMuted={false}
            onToggleMute={() => {}}
          />
          <RightControls
            onTogglePanel={() => {}}
            onZoomIn={() => {}}
            onZoomOut={() => {}}
            onToggleFullscreen={() => {}}
          />
          <RadioPanel
            song={song}
            isPlaying={isPlaying}
            onTogglePlay={() => isPlaying ? pause() : resume()}
            onClose={() => {}}
          />
        </div>
        <div className="absolute inset-0 vignette pointer-events-none" />
      </div>

      <SettingsPanel
        open={false} onClose={() => {}}
        selectedScene="auto" onSelectScene={() => {}}
        effects={{ particles: true, bloom: false, vignette: true }}
        onToggleEffect={() => {}}
      />

      <div className="fixed top-30 right-90 z-10 text-13 font-semibold tracking-wider text-white-30">
        HEAR THE 🌍
      </div>
    </div>
  );
}
