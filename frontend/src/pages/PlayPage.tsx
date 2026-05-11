import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAuthStore } from '@/stores/authStore';
import { usePlayerStore } from '@/stores/playerStore';
import { songsApi } from '@/api/songs';
import { favoritesApi } from '@/api/favorites';
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
    const GROUND_SZ = 2000, ppu = 2048 / GROUND_SZ;
    const ROAD_MAJOR = 24, ROAD_MINOR = 12;

    // Base ground - lighter dark blue-gray
    ctx.fillStyle = '#3a4a5e'; ctx.fillRect(0, 0, 2048, 2048);
    // Noise
    for (let i = 0; i < 12000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * 2048, Math.random() * 2048, 2, 2);
    }

    // Major roads - medium gray asphalt (lighter)
    const mOff = Math.round(ROAD_MAJOR * ppu);
    ctx.fillStyle = '#3d4a5c'; ctx.lineWidth = 5 * ppu;
    for (let x = 1024 % mOff; x < 2048; x += mOff) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 2048); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(2048, x); ctx.stroke();
    }
    // Major road center dashes - bright orange
    ctx.strokeStyle = '#FFB366'; ctx.lineWidth = 0.8 * ppu;
    ctx.setLineDash([4 * ppu, 6 * ppu]);
    for (let x = 1024 % mOff; x < 2048; x += mOff) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 2048); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(2048, x); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Sidewalks - bright concrete
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1.5 * ppu;
    for (let x = 1024 % mOff; x < 2048; x += mOff) {
      ctx.beginPath(); ctx.moveTo(x - 2.8 * ppu, 0); ctx.lineTo(x - 2.8 * ppu, 2048); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 2.8 * ppu, 0); ctx.lineTo(x + 2.8 * ppu, 2048); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x - 2.8 * ppu); ctx.lineTo(2048, x - 2.8 * ppu); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x + 2.8 * ppu); ctx.lineTo(2048, x + 2.8 * ppu); ctx.stroke();
    }

    // Minor roads - lighter
    const mnOff = Math.round(ROAD_MINOR * ppu);
    ctx.fillStyle = '#334050'; ctx.lineWidth = 2.2 * ppu;
    for (let x = 1024 % mnOff; x < 2048; x += mnOff) {
      if (Math.abs((x - (1024 % mOff)) % mOff) < 3 * ppu) continue;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 2048); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(2048, x); ctx.stroke();
    }

    // Radial fade at edges
    const grad = ctx.createRadialGradient(1024, 1024, 800 * ppu, 1024, 1024, 1024 * ppu);
    grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(0.85, 'rgba(0,0,0,0)');
    grad.addColorStop(0.95, 'rgba(255,140,66,0.25)'); grad.addColorStop(1, 'rgba(255,140,66,0.55)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 2048, 2048);

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
      <meshStandardMaterial map={texture} roughness={0.6} metalness={0.05} color="#e0e8f0" emissive="#1a2530" emissiveIntensity={0.15} />
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
  const sparkRef = useRef<THREE.Points>(null);

  const { dustGeom, dustVel, ffGeom, ffPhase, bpGeom, bpProg, sparkGeom, sparkPhase } = useMemo(() => {
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
    // Sparkle particles - scattered across the scene
    const sGeom = new THREE.BufferGeometry();
    const sPos = new Float32Array(120 * 3);
    const sPhase = new Float32Array(120);
    for (let i = 0; i < 120; i++) {
      sPos[i * 3] = (Math.random() - 0.5) * 300;
      sPos[i * 3 + 1] = 2 + Math.random() * 40;
      sPos[i * 3 + 2] = (Math.random() - 0.5) * 300 - 50;
      sPhase[i] = Math.random() * Math.PI * 2;
    }
    sGeom.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    return { dustGeom: dGeom, dustVel: dVel, ffGeom: fGeom, ffPhase: fPhase, bpGeom: bGeom, bpProg: bProg, sparkGeom: sGeom, sparkPhase: sPhase };
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
    // Sparkle opacity - particles blink in/out
    if (sparkRef.current) {
      const mat = sparkRef.current.material as THREE.PointsMaterial;
      // Each particle sparkles at its own frequency, creating a twinkling effect across the whole system
      const twinkle = 0.2 + 0.5 * Math.abs(Math.sin(t * 0.7));
      mat.opacity = twinkle;
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
      {/* Sparkle particles - twinkling gold dust in the air */}
      <points ref={sparkRef} geometry={sparkGeom}>
        <pointsMaterial color="#FFD700" size={0.4} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
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
    const hash = (x: number, z: number) => {
      const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      return n - Math.floor(n);
    };
    const isRoad = (x: number, z: number) => {
      const hm = 2.5;
      const mx = ((x % 24) + 24) % 24, mz = ((z % 24) + 24) % 24;
      if (mx < hm || mx > 24 - hm || mz < hm || mz > 24 - hm) return true;
      const nx = ((x % 12) + 12) % 12, nz = ((z % 12) + 12) % 12;
      return nx < 1.2 || nx > 12 - 1.2 || nz < 1.2 || nz > 12 - 1.2;
    };

    const bGeom = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
    const MATS = {
      dark: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.05 }),
      mid: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, metalness: 0.08 }),
      light: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75, metalness: 0.1 }),
      dark2: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.05 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.2, emissive: 0xFFE4B5, emissiveIntensity: 0.1 }),
      roof: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.1 }),
      window: new THREE.MeshStandardMaterial({ color: 0xFFE4B5, emissive: 0xFFE4B5, emissiveIntensity: 0.4, roughness: 0.2 }),
      park: new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.9 }),
      treeTrunk: new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 }),
      treeLeaf: new THREE.MeshStandardMaterial({ color: 0x1a4a10, roughness: 0.8 }),
    };

    const addWindows = (x: number, z: number, w: number, h: number, d: number, floors: number, odds: number) => {
      for (let fy = 0; fy < floors; fy++) {
        for (let face = 0; face < 4; face++) {
          if (hash(x * 7 + fy * 3 + face, z * 5) > odds) continue;
          const angle = face * Math.PI / 2;
          const wx = x + Math.cos(angle) * (w / 2 + 0.03);
          const wy = fy * 1.15 - h / 2 + 0.7;
          const wz = z + Math.sin(angle) * (d / 2 + 0.03);
          const wg = new THREE.BoxGeometry(0.3, 0.4, 0.04);
          const wm = new THREE.Mesh(wg, MATS.window);
          wm.position.set(wx, wy, wz);
          group.add(wm);
        }
      }
    };

    const placed: { x: number; z: number }[] = [];
    const CITY_R = 200, BLDG_STEP = 3, MIN_SPACING = 5;

    for (let x = -CITY_R; x <= CITY_R; x += BLDG_STEP) {
      for (let z = -CITY_R; z <= CITY_R; z += BLDG_STEP) {
        const dist = Math.sqrt(x * x + z * z);
        if (dist > CITY_R) continue;
        if (isRoad(x, z)) continue;
        if (placed.some(p => Math.sqrt((x - p.x) ** 2 + (z - p.z) ** 2) < MIN_SPACING)) continue;
        if (hash(x * 0.05, z * 0.05) > 0.65) continue;
        const dxL = x, dzL = z + 40;
        if (Math.sqrt(dxL * dxL + dzL * dzL) < 22) continue;

        const n = hash(x * 0.03, z * 0.03);
        const n2 = hash(z * 0.05, x * 0.05);
        const typeRoll = n2;
        let mesh: THREE.Mesh | null = null;

        if (typeRoll < 0.40) {
          // Type A: Low flat house
          const bh = 0.8 + n * 0.8, bw = 2 + n * 2.5, bd = 2 + hash(z * 0.07, x * 0.07) * 2;
          const mat = [MATS.dark, MATS.mid, MATS.light, MATS.dark2][Math.floor(n * 4)];
          mesh = new THREE.Mesh(bGeom(bw, bh, bd), mat);
          mesh.position.set(x, bh / 2, z);
          if (bh > 1) addWindows(x, z, bw, bh, bd, Math.floor(bh * 0.7), 0.92);
        } else if (typeRoll < 0.65) {
          // Type B: Multi-story residential
          const bh = 2 + n * 2.5, bw = 1.8 + n * 2, bd = 1.8 + n2 * 2;
          const mat = [MATS.mid, MATS.light, MATS.dark][Math.floor(n * 3)];
          mesh = new THREE.Mesh(bGeom(bw, bh, bd), mat);
          mesh.position.set(x, bh / 2, z);
          const rf = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.4, 0.2, bd - 0.4), MATS.roof);
          rf.position.set(x, bh + 0.1, z); group.add(rf);
          addWindows(x, z, bw, bh, bd, Math.floor(bh * 0.8), 0.88);
        } else if (typeRoll < 0.80) {
          // Type C: Commercial/glass
          const bh = 1.5 + n * 2, bw = 3 + n * 3, bd = 2.5 + n2 * 2.5;
          mesh = new THREE.Mesh(bGeom(bw, bh, bd), MATS.glass);
          mesh.position.set(x, bh / 2, z);
          const eq = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 0.8), MATS.roof);
          eq.position.set(x, bh + 0.25, z); group.add(eq);
          addWindows(x, z, bw, bh, bd, Math.floor(bh * 0.6), 0.88);
        } else if (typeRoll < 0.92) {
          // Type D: Tower
          const bh = 5 + n * 4, bw = 1.5 + n * 1.5, bd = 1.5 + n2 * 1.5;
          const mat = [MATS.dark, MATS.mid][Math.floor(n * 2)];
          mesh = new THREE.Mesh(bGeom(bw, bh, bd), mat);
          mesh.position.set(x, bh / 2, z);
          addWindows(x, z, bw, bh, bd, Math.floor(bh * 0.8), 0.9);
          const topH = 0.8, topW = bw - 0.6;
          const topM = new THREE.Mesh(new THREE.BoxGeometry(topW, topH, topW), MATS.roof);
          topM.position.set(x, bh + topH / 2, z); group.add(topM);
        } else {
          // Type E: Park
          const pr = 3 + n * 4;
          mesh = new THREE.Mesh(new THREE.CylinderGeometry(pr, pr, 0.15, 16), MATS.park);
          mesh.position.set(x, 0.075, z);
          for (let ti = 0; ti < Math.floor(3 + n * 5); ti++) {
            const ta = Math.random() * Math.PI * 2, td = Math.random() * pr * 0.8;
            const tx = x + Math.cos(ta) * td, tz = z + Math.sin(ta) * td;
            const th = 0.8 + Math.random() * 1.5;
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, th, 6), MATS.treeTrunk);
            trunk.position.set(tx, th / 2, tz); group.add(trunk);
            const crownR = 0.3 + Math.random() * 0.5;
            const crown = new THREE.Mesh(new THREE.ConeGeometry(crownR, 0.8 + Math.random() * 0.6, 8), MATS.treeLeaf);
            crown.position.set(tx, th + crownR * 0.6, tz); group.add(crown);
          }
        }

        if (mesh) {
          mesh.castShadow = true; mesh.receiveShadow = true;
          group.add(mesh);
          placed.push({ x, z });
        }
      }
    }

    // Street lamps along major roads
    const lampBase = new THREE.CylinderGeometry(0.1, 0.15, 4, 8);
    const lampPole = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.6 });
    for (let rx = -200; rx <= 200; rx += 24) {
      if (Math.abs(rx) > 200) continue;
      for (let z = -200; z <= 200; z += 8) {
        if (Math.abs(z) > 200) continue;
        if (Math.sqrt(rx * rx + (z + 40) * (z + 40)) < 25) continue;
        const lampG = new THREE.Group();
        const pole = new THREE.Mesh(lampBase, lampMat);
        pole.position.set(rx + 3.5, 2, z); lampG.add(pole);
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xFFE4B5 }));
        light.position.set(rx + 3.5, 4.2, z); lampG.add(light);
        group.add(lampG);
      }
    }

    return () => { while (group.children.length) group.remove(group.children[0]); };
  }, []);
  return <group ref={instancedRef} />;
}

// ===== MAIN SCENE =====
// ===== SNOW PARTICLES =====
function SnowParticles() {
  const snowRef = useRef<THREE.Points>(null);
  const { snowGeom, snowVel } = useMemo(() => {
    const count = 400;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 300;
      pos[i * 3 + 1] = Math.random() * 120;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 300;
      vel[i * 3] = (Math.random() - 0.5) * 0.3;
      vel[i * 3 + 1] = -(0.3 + Math.random() * 0.8);
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { snowGeom: geom, snowVel: vel };
  }, []);

  useFrame((_, delta) => {
    if (!snowRef.current) return;
    const pos = snowGeom.attributes.position.array as Float32Array;
    const wind = Math.sin(useFrame as any) * 0.5;
    for (let i = 0; i < 400; i++) {
      pos[i * 3] += (snowVel[i * 3] + (Math.sin(Date.now() * 0.001 + i * 0.1) * 0.15)) * delta * 8;
      pos[i * 3 + 1] += snowVel[i * 3 + 1] * delta * 8;
      pos[i * 3 + 2] += (snowVel[i * 3 + 2] + (Math.cos(Date.now() * 0.001 + i * 0.1) * 0.15)) * delta * 8;
      if (pos[i * 3 + 1] < -10) {
        pos[i * 3 + 1] = 110;
        pos[i * 3] = (Math.random() - 0.5) * 300;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 300;
      }
      if (Math.abs(pos[i * 3]) > 180) pos[i * 3] = (Math.random() - 0.5) * 300;
      if (Math.abs(pos[i * 3 + 2]) > 180) pos[i * 3 + 2] = (Math.random() - 0.5) * 300;
    }
    snowGeom.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={snowRef} geometry={snowGeom}>
      <pointsMaterial color="#ffffff" size={0.4} transparent opacity={0.7} depthWrite={false} blending={THREE.NormalBlending} sizeAttenuation />
    </points>
  );
}

function ZoomController({ zoomLevel }: { zoomLevel: number }) {
  const { camera } = useThree();
  const prevZoom = useRef(zoomLevel);
  useEffect(() => {
    if (prevZoom.current !== zoomLevel) {
      prevZoom.current = zoomLevel;
      const targetZ = -55 - zoomLevel * 15;
      camera.position.z = targetZ;
    }
  }, [zoomLevel, camera]);
  return null;
}

// ===== CARS =====
function CarModel({ color }: { color: string }) {
  return (
    <group>
      {/* body */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.7, 0.35, 1.6]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* cabin */}
      <mesh position={[0, 0.55, -0.15]}>
        <boxGeometry args={[0.6, 0.22, 0.8]} />
        <meshStandardMaterial color="#111" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* wheels */}
      {[[-0.4, 0.5], [0.4, 0.5], [-0.4, -0.55], [0.4, -0.55]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.12, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.12, 8]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      ))}
      {/* headlights */}
      <mesh position={[-0.25, 0.4, 0.85]}>
        <boxGeometry args={[0.1, 0.12, 0.04]} />
        <meshBasicMaterial color="#ffffcc" />
      </mesh>
      <mesh position={[0.25, 0.4, 0.85]}>
        <boxGeometry args={[0.1, 0.12, 0.04]} />
        <meshBasicMaterial color="#ffffcc" />
      </mesh>
      {/* taillights */}
      <mesh position={[-0.25, 0.4, -0.85]}>
        <boxGeometry args={[0.1, 0.12, 0.04]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <mesh position={[0.25, 0.4, -0.85]}>
        <boxGeometry args={[0.1, 0.12, 0.04]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
}

function Cars() {
  const carsRef = useRef<THREE.Group>(null);
  const carData = useMemo(() => {
    const cars: { roadAxis: 'x' | 'z'; roadPos: number; startOffset: number; speed: number; color: string; lane: number }[] = [];
    const colors = ['#cc3333', '#3366cc', '#33aa55', '#ffaa00', '#9933cc', '#ffffff', '#ff6699', '#3388aa',
                    '#cc4400', '#2277aa', '#88aa33', '#dd4488', '#44aacc', '#aa7733', '#6666cc', '#ee7722',
                    '#229944', '#bb3355', '#5577dd', '#cc9933'];
    const roadInterval = 24;
    const cityR = 150;

    for (let i = 0; i < 20; i++) {
      const roadAxis = Math.random() > 0.5 ? 'x' : 'z';
      // Major roads at multiples of 24
      const roadIdx = Math.floor(Math.random() * (Math.floor(cityR / roadInterval) * 2 + 1)) - Math.floor(cityR / roadInterval);
      const roadPos = roadIdx * roadInterval;
      const startOffset = (Math.random() - 0.5) * cityR * 2;
      const speed = 1.5 + Math.random() * 4;
      const color = colors[i % colors.length];
      const lane = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 1.2);
      cars.push({ roadAxis, roadPos, startOffset, speed, color, lane });
    }
    return cars;
  }, []);

  useFrame((_, delta) => {
    if (!carsRef.current) return;
    const dt = Math.min(delta, 0.1);
    carData.forEach((car, i) => {
      const child = carsRef.current!.children[i] as THREE.Group;
      if (!child) return;
      if (car.roadAxis === 'x') {
        child.position.x += car.speed * dt * (car.speed > 0 ? 1 : -1);
        child.position.z = car.roadPos + car.lane;
        child.rotation.y = car.speed > 0 ? Math.PI / 2 : -Math.PI / 2;
        if (Math.abs(child.position.x) > 160) child.position.x = -child.position.x;
      } else {
        child.position.z += car.speed * dt * (car.speed > 0 ? 1 : -1);
        child.position.x = car.roadPos + car.lane;
        child.rotation.y = car.speed > 0 ? 0 : Math.PI;
        if (Math.abs(child.position.z) > 160) child.position.z = -child.position.z;
      }
    });
  });

  return (
    <group ref={carsRef}>
      {carData.map((car, i) => (
        <group
          key={i}
          position={[
            car.roadAxis === 'x' ? car.startOffset : car.roadPos + car.lane,
            0.02,
            car.roadAxis === 'z' ? car.startOffset : car.roadPos + car.lane,
          ]}
        >
          <CarModel color={car.color} />
          {/* headlight glow */}
          <pointLight position={[0, 0.4, 0.85]} color="#ffffcc" intensity={0.15} distance={3} />
        </group>
      ))}
    </group>
  );
}

// ===== PEDESTRIANS =====
function PersonModel({ color, walkPhase }: { color: string; walkPhase: number }) {
  const legSwing = Math.sin(walkPhase) * 0.5;
  const bodyBob = Math.abs(Math.sin(walkPhase)) * 0.04;
  return (
    <group position={[0, bodyBob, 0]}>
      {/* body */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.5, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshStandardMaterial color="#f5d0b0" roughness={0.5} />
      </mesh>
      {/* left leg */}
      <group position={[-0.06, 0.52, 0]}>
        <mesh rotation={[legSwing, 0, 0]} position={[0, -0.175, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.35, 6]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      </group>
      {/* right leg */}
      <group position={[0.06, 0.52, 0]}>
        <mesh rotation={[-legSwing, 0, 0]} position={[0, -0.175, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.35, 6]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function Pedestrians() {
  const pedsRef = useRef<THREE.Group>(null);
  const speeRef = useRef<number[]>([]);
  const phaseRef = useRef<number[]>([]);
  const pedData = useMemo(() => {
    const peds: { sideX: number; sideZ: number; startOff: number; speed: number; color: string; axis: 'x'|'z' }[] = [];
    const colors = ['#cc4444','#4444cc','#44aa44','#ccaa22','#8844aa','#ffffff','#4488aa','#cc6622',
                    '#226688','#88aa44','#cc4488','#44aacc','#aa7744','#6666cc','#ee7744','#44aa88'];
    for (let i = 0; i < 72; i++) {
      const axis = Math.random() > 0.5 ? 'x' : 'z';
      const roadIdx = (Math.floor(Math.random() * 13) - 6) * 24;
      const offset = 3.2 + Math.random() * 1.5;
      const sign = Math.random() > 0.5 ? 1 : -1;
      const startOff = (Math.random() - 0.5) * 300;
      const speed = 0.4 + Math.random() * 0.8;
      peds.push({
        axis,
        sideX: axis === 'x' ? roadIdx + offset * sign : roadIdx,
        sideZ: axis === 'z' ? roadIdx + offset * sign : roadIdx,
        startOff, speed,
        color: colors[i % colors.length],
      });
    }
    speeRef.current = peds.map((p) => p.speed);
    phaseRef.current = peds.map(() => Math.random() * Math.PI * 2);
    return peds;
  }, []);

  useFrame((_, delta) => {
    if (!pedsRef.current) return;
    const dt = Math.min(delta, 0.1);
    pedData.forEach((p, i) => {
      const outer = pedsRef.current!.children[i] as THREE.Group;
      if (!outer) return;
      const walkSpeed = speeRef.current[i];
      phaseRef.current[i] += walkSpeed * 10 * dt;
      // Update walk animation on the PersonModel (first child of outer group)
      const person = outer.children[0] as THREE.Group;
      if (person) {
        const phase = phaseRef.current[i];
        const legSwing = Math.sin(phase) * 0.5;
        const bodyBob = Math.abs(Math.sin(phase)) * 0.04;
        person.position.y = bodyBob;
        // left leg (child 2 of person)
        const leftLeg = person.children[2] as THREE.Group;
        if (leftLeg) leftLeg.rotation.x = legSwing;
        // right leg (child 3 of person)
        const rightLeg = person.children[3] as THREE.Group;
        if (rightLeg) rightLeg.rotation.x = -legSwing;
      }
      // Move along road
      if (p.axis === 'x') {
        outer.position.x += p.speed * dt;
        outer.position.z = p.sideZ;
        outer.rotation.y = p.speed > 0 ? Math.PI/2 : -Math.PI/2;
        if (Math.abs(outer.position.x) > 160) outer.position.x = -outer.position.x;
      } else {
        outer.position.z += p.speed * dt;
        outer.position.x = p.sideX;
        outer.rotation.y = p.speed > 0 ? 0 : Math.PI;
        if (Math.abs(outer.position.z) > 160) outer.position.z = -outer.position.z;
      }
    });
  });

  return (
    <group ref={pedsRef}>
      {pedData.map((p, i) => (
        <group key={i} position={[p.axis==='x' ? p.startOff : p.sideX, 0.02, p.axis==='z' ? p.startOff : p.sideZ]}>
          <PersonModel color={p.color} walkPhase={phaseRef.current[i]} />
        </group>
      ))}
    </group>
  );
}

function Scene3D({ zoomLevel, effects }: { zoomLevel: number; effects: { particles: boolean; bloom: boolean; vignette: boolean } }) {
  return (
    <>
      <SkyDome />
      <fog attach="fog" args={[effects.bloom ? '#ffaa66' : '#e07840', effects.bloom ? 80 : 120, effects.bloom ? 350 : 550]} />
      <ambientLight intensity={effects.bloom ? 1.6 : 0.8} color={effects.bloom ? '#ffcc88' : '#5a7090'} />
      <hemisphereLight intensity={effects.bloom ? 1.4 : 0.7} color="#6a80a0" groundColor="#FF8C42" />
      <directionalLight position={[50, 100, 50]} intensity={effects.bloom ? 0.7 : 0.25} color={effects.bloom ? '#ffddaa' : '#8899aa'} />
      {effects.bloom && <pointLight position={[-30, 30, -30]} intensity={1.0} color="#ff9944" distance={120} />}
      <ZoomController zoomLevel={zoomLevel} />
      <OrbitControls
        target={[-30, -5, -20]}
        minDistance={30} maxDistance={350}
        maxPolarAngle={Math.PI * 0.42} minPolarAngle={0.15}
        enableDamping dampingFactor={0.08}
        rotateSpeed={0.4} zoomSpeed={1.0}
      />
      <Stars radius={150} depth={80} count={300} factor={3} saturation={0.2} fade speed={0.5} />
      <Ground />
      <Buildings />
      <Cars />
      <Pedestrians />
      <Lighthouse />
      {effects.particles && <Particles />}
      {effects.particles && <SnowParticles />}
    </>
  );
}

export default function PlayPage() {
  const { songId } = useParams<{ songId: string }>();
  const { isPlaying, currentSong, play, pause, resume, queue, volume, setVolume } = usePlayerStore();
  const [demoSong, setDemoSong] = useState<Song | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const { isLoggedIn } = useAuthStore();
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(0.5);
  const [zoomLevel, setZoomLevel] = useState(5);
  const [selectedScene, setSelectedScene] = useState('auto');
  const [effects, setEffects] = useState({ particles: true, bloom: false, vignette: true });
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!songId) return;
    // 如果队列为空，先加载歌曲列表作为队列
    if (queue.length === 0) {
      songsApi.list({ size: 50, sort: 'newest' }).then((r) => {
        const list = r.data.records;
        const target = list.find((s) => s.id === Number(songId));
        if (target) {
          play(target, list);
          setIsFavorited(!!target.isFavorited);
        } else {
          songsApi.getById(Number(songId)).then((res) => {
            play(res.data, list);
            setIsFavorited(!!res.data.isFavorited);
          }).catch(() => {
            play(DEMO_SONG);
            setDemoSong(DEMO_SONG);
          });
        }
      }).catch(() => {
        play(DEMO_SONG);
        setDemoSong(DEMO_SONG);
      });
    } else if (!queue.some((s) => s.id === Number(songId))) {
      songsApi.getById(Number(songId)).then((res) => {
        play(res.data, [...queue, res.data]);
        setIsFavorited(!!res.data.isFavorited);
      }).catch(() => {
        play(DEMO_SONG);
        setDemoSong(DEMO_SONG);
      });
    } else {
      // 队列中已有该歌曲，直接读取收藏状态
      const existing = queue.find((s) => s.id === Number(songId));
      if (existing) setIsFavorited(!!existing.isFavorited);
    }
  }, [songId]);

  const storeSong = currentSong();
  const song = storeSong || demoSong || DEMO_SONG;

  const handleToggleFavorite = () => {
    if (!song.id) return;
    if (!isLoggedIn) {
      setToast('请先登录后再收藏歌曲');
      setTimeout(() => setToast(''), 2500);
      return;
    }
    const next = !isFavorited;
    setIsFavorited(next);
    if (song) song.isFavorited = next;
    (next ? favoritesApi.add(song.id) : favoritesApi.remove(song.id)).catch(() => {
      setIsFavorited(!next);
      if (song) song.isFavorited = !next;
    });
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.max(1, z - 1));
  const handleZoomOut = () => setZoomLevel((z) => Math.min(10, z + 1));
  const handleToggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.body.requestFullscreen();
  };

  return (
    <>
    <div className="fixed inset-0" style={{ background: '#0a0a18' }}>
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [80, 55, -100], fov: 55 }}>
          <Scene3D zoomLevel={zoomLevel} effects={effects} />
        </Canvas>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* 未登录提示弹窗 */}
        {toast && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto" onClick={() => setToast('')}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-dark-90 border border-orange-20 rounded-2xl px-8 py-6 text-center max-w-xs w-11/12 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-3xl mb-3">🔒</div>
              <div className="text-white text-base font-semibold mb-2">需要登录</div>
              <div className="text-white-50 text-sm mb-5">{toast}</div>
              <button
                className="px-6 py-2 rounded-xl bg-accent-15 border border-orange-30 text-white text-sm font-semibold transition-all hover:bg-[rgba(255,140,66,0.25)]"
                onClick={() => setToast('')}
              >
                知道了
              </button>
            </div>
          </div>
        )}
        <div className="pointer-events-auto">
          <TopIcons
            onOpenSettings={() => setShowSettings(true)}
            isMuted={isMuted}
            onToggleMute={() => {
              if (isMuted) {
                setIsMuted(false);
                setVolume(prevVolumeRef.current);
              } else {
                prevVolumeRef.current = volume;
                setIsMuted(true);
                setVolume(0);
              }
            }}
          />
          <RightControls
            onTogglePanel={() => setShowPanel(!showPanel)}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onToggleFullscreen={handleToggleFullscreen}
          />
          {showPanel && (
            <RadioPanel
              song={song}
              isPlaying={isPlaying}
              isFavorited={isFavorited}
              onTogglePlay={() => isPlaying ? pause() : resume()}
              onToggleFavorite={handleToggleFavorite}
              onClose={() => setShowPanel(false)}
            />
          )}
        </div>
        {effects.vignette && <div className="absolute inset-0 vignette pointer-events-none" />}
      </div>

      <div className="fixed top-30 right-90 z-10 text-13 font-semibold tracking-wider text-white-30">
        HEAR THE 🌍
      </div>
    </div>

    <SettingsPanel
      open={showSettings} onClose={() => setShowSettings(false)}
      selectedScene={selectedScene} onSelectScene={setSelectedScene}
      effects={effects}
      onToggleEffect={(key) => setEffects((e) => ({ ...e, [key]: !e[key] }))}
    />
    </>
  );
}
