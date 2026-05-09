import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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
        vertexShader={/*glsl*/`
          varying vec3 vWPos;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWPos = wp.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`}
        fragmentShader={/*glsl*/`
          uniform vec3 topC, midC, horC, glowC;
          varying vec3 vWPos;
          void main() {
            float h = normalize(vWPos + 400.0).y;
            vec3 c;
            if (h > 0.6) c = mix(midC, topC, smoothstep(0.6, 1.0, h));
            else if (h > 0.25) c = mix(horC, midC, smoothstep(0.25, 0.6, h));
            else if (h > -0.15) c = mix(glowC, horC, smoothstep(-0.15, 0.25, h));
            else c = glowC;
            gl_FragColor = vec4(c, 1.0);
          }`}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ===== GROUND WITH ROAD TEXTURE =====
function RoadGround() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048; canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;
    const GROUND_SZ = 2000;
    const ppu = 2048 / GROUND_SZ;

    ctx.fillStyle = '#2d3a4f';
    ctx.fillRect(0, 0, 2048, 2048);
    for (let i = 0; i < 8000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
      ctx.fillRect(Math.random() * 2048, Math.random() * 2048, 2, 2);
    }

    const ROAD_MAJOR = 24, ROAD_MINOR = 12;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 5 * ppu;
    for (let x = 1024 % Math.round(ROAD_MAJOR * ppu); x < 2048; x += ROAD_MAJOR * ppu) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 2048); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(2048, x); ctx.stroke();
    }

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.2 * ppu;
    for (let x = 1024 % Math.round(ROAD_MINOR * ppu); x < 2048; x += ROAD_MINOR * ppu) {
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

// ===== BUILDINGS =====
function Buildings() {
  const { scene } = useThree();

  useEffect(() => {
    const group = new THREE.Group();
    const CITY_R = 200;
    const BLDG_STEP = 3;
    const MIN_SPACING = 5;

    const hash = (x: number, z: number) => {
      const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      return n - Math.floor(n);
    };

    const isRoad = (x: number, z: number) => {
      const hm = 2.5;
      const mx = ((x % 24) + 24) % 24;
      const mz = ((z % 24) + 24) % 24;
      if (mx < hm || mx > 24 - hm || mz < hm || mz > 24 - hm) return true;
      const nx = ((x % 12) + 12) % 12;
      const nz = ((z % 12) + 12) % 12;
      if (nx < 1.2 || nx > 12 - 1.2 || nz < 1.2 || nz > 12 - 1.2) return true;
      return false;
    };

    const bGeom = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
    const mats = {
      dark: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.05 }),
      mid: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, metalness: 0.08 }),
      light: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75, metalness: 0.1 }),
      dark2: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.05 }),
      roof: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.1 }),
      window: new THREE.MeshStandardMaterial({ color: 0xFFE4B5, emissive: 0xFFE4B5, emissiveIntensity: 0.25, roughness: 0.2 }),
      park: new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.9, metalness: 0 }),
      treeTrunk: new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9, metalness: 0 }),
      treeLeaf: new THREE.MeshStandardMaterial({ color: 0x1a4a10, roughness: 0.8, metalness: 0 }),
    };

    const placed: { x: number; z: number }[] = [];
    for (let x = -CITY_R; x <= CITY_R; x += BLDG_STEP) {
      for (let z = -CITY_R; z <= CITY_R; z += BLDG_STEP) {
        const dist = Math.sqrt(x * x + z * z);
        if (dist > CITY_R) continue;
        if (isRoad(x, z)) continue;
        if (placed.some(p => Math.sqrt((x - p.x) ** 2 + (z - p.z) ** 2) < MIN_SPACING)) continue;
        if (hash(x * 0.05, z * 0.05) > 0.65) continue;
        const dx = x, dz = z;
        if (Math.sqrt(dx * dx + dz * dz) < 22) continue;

        const n = hash(x * 0.03, z * 0.03);
        const n2 = hash(z * 0.05, x * 0.05);
        const typeRoll = n2;

        if (typeRoll < 0.40) {
          const bh = 0.8 + n * 0.8, bw = 2 + n * 2.5, bd = 2 + hash(z * 0.07, x * 0.07) * 2;
          const m = new THREE.Mesh(bGeom(bw, bh, bd), [mats.dark, mats.mid, mats.light, mats.dark2][Math.floor(n * 4)]);
          m.position.set(x, bh / 2, z); m.castShadow = m.receiveShadow = true;
          group.add(m);
        } else if (typeRoll < 0.65) {
          const bh = 2 + n * 2.5, bw = 1.8 + n * 2, bd = 1.8 + n2 * 2;
          const m = new THREE.Mesh(bGeom(bw, bh, bd), [mats.mid, mats.light, mats.dark][Math.floor(n * 3)]);
          m.position.set(x, bh / 2, z); m.castShadow = m.receiveShadow = true;
          group.add(m);
        } else if (typeRoll < 0.80) {
          const bh = 1.5 + n * 2, bw = 3 + n * 3, bd = 2.5 + n2 * 2.5;
          const gMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.2, emissive: 0xFFE4B5, emissiveIntensity: 0.08 });
          const m = new THREE.Mesh(bGeom(bw, bh, bd), gMat);
          m.position.set(x, bh / 2, z); m.castShadow = m.receiveShadow = true;
          group.add(m);
        } else if (typeRoll < 0.92) {
          const bh = 5 + n * 4, bw = 1.5 + n * 1.5, bd = 1.5 + n2 * 1.5;
          const m = new THREE.Mesh(bGeom(bw, bh, bd), [mats.dark, mats.mid][Math.floor(n * 2)]);
          m.position.set(x, bh / 2, z); m.castShadow = m.receiveShadow = true;
          group.add(m);
        } else {
          const pr = 3 + n * 4;
          const p = new THREE.Mesh(new THREE.CylinderGeometry(pr, pr, 0.15, 16), mats.park);
          p.position.set(x, 0.075, z); group.add(p);
          for (let ti = 0; ti < Math.floor(3 + n * 5); ti++) {
            const ta = Math.random() * Math.PI * 2, td = Math.random() * pr * 0.8;
            const tx = x + Math.cos(ta) * td, tz = z + Math.sin(ta) * td;
            const th = 0.8 + Math.random() * 1.5;
            group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, th, 6), mats.treeTrunk)).position.set(tx, th / 2, tz);
            group.add(new THREE.Mesh(new THREE.ConeGeometry(0.3 + Math.random() * 0.5, 0.8 + Math.random() * 0.6, 8), mats.treeLeaf)).position.set(tx, th + 0.3, tz);
          }
        }
        placed.push({ x, z });
      }
    }
    scene.add(group);
    return () => { scene.remove(group); };
  }, [scene]);

  return null;
}

// ===== LIGHTHOUSE =====
function Lighthouse() {
  const groupRef = useRef<THREE.Group>(null);
  const chBodyRef = useRef<THREE.Mesh>(null);
  const topAuraRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.PointLight>(null);
  const beamRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (beamRef.current) beamRef.current.rotation.y += 0.0015;
    const bp = 1 + Math.sin(t * 1.3) * 0.05;
    if (beamRef.current) beamRef.current.scale.set(bp, 1, bp);
    if (chBodyRef.current) {
      const gp = 0.7 + Math.sin(t * 2.0) * 0.15;
      (chBodyRef.current.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.5 * gp;
    }
    if (topAuraRef.current) {
      topAuraRef.current.material.opacity = 0.15 + Math.sin(t * 2.0) * 0.08;
      topAuraRef.current.scale.setScalar(0.9 + Math.sin(t * 1.7) * 0.08);
    }
    if (beaconRef.current) beaconRef.current.intensity = 1.8 + Math.sin(t * 2.0) * 0.4;
  });

  return (
    <group ref={groupRef} position={[0, 0, -40]}>
      {/* Base tiers */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[12, 14, 2, 48]} />
        <meshStandardMaterial color="#4a5568" roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[10, 12, 2, 48]} />
        <meshStandardMaterial color="#3d4556" roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[8, 10, 1.5, 48]} />
        <meshStandardMaterial color="#5a6578" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Glass tower sections */}
      {[[6, 8, 8, 9], [4.5, 6, 6, 16], [5, 4.5, 4, 21]].map(([rt, rb, h, y], i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <cylinderGeometry args={[rt as number, rb as number, h as number, 48]} />
          <meshPhysicalMaterial color="#FF8C42" roughness={0.1} metalness={0.0}
            emissive="#FF6B35" emissiveIntensity={0.15} transparent opacity={0.45}
            clearcoat={0.05} clearcoatRoughness={0.3} />
        </mesh>
      ))}

      {/* Light chamber */}
      <mesh position={[0, 23.5, 0]}>
        <cylinderGeometry args={[6, 5, 1.5, 48]} />
        <meshStandardMaterial color="#FFB366" roughness={0.2} metalness={0.05} emissive="#FFB366" emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={chBodyRef} position={[0, 25.5, 0]}>
        <cylinderGeometry args={[5, 6, 3, 48]} />
        <meshPhysicalMaterial color="#FFE4B5" roughness={0.05} metalness={0} emissive="#FFB366"
          emissiveIntensity={0.5} transparent opacity={0.45} clearcoat={0.15} />
      </mesh>
      <mesh position={[0, 25.8, 0]}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Chamber roof */}
      <mesh position={[0, 28, 0]}>
        <coneGeometry args={[5.5, 2, 48]} />
        <meshStandardMaterial color="#FF8C42" roughness={0.2} metalness={0.1} emissive="#FF8C42" emissiveIntensity={0.7} />
      </mesh>

      {/* Top glow */}
      <mesh position={[0, 29.5, 0]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh ref={topAuraRef} position={[0, 29.5, 0]}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshBasicMaterial color="#FFB366" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {/* Beacon light */}
      <pointLight ref={beaconRef} position={[0, 29.5, 0]} color="#FF8C42" intensity={1.8} distance={300} decay={1.5} />
      <pointLight position={[0, 1.5, 0]} color="#FFB366" intensity={0.6} distance={40} decay={2} />

      {/* Beam */}
      <group ref={beamRef} position={[0, 29.5, 0]} rotation={[(5 * Math.PI) / 180, 0, 0]}>
        {[[1, 0.1], [0.5, 0.06]].map(([r, o], i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 50]}>
            <coneGeometry args={[r as number, 100, 32, 8, true]} />
            <meshBasicMaterial color="#FFE4B5" transparent opacity={o as number} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))}
      </group>

      {/* Base glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
        <torusGeometry args={[15, 0.5, 16, 80]} />
        <meshBasicMaterial color="#FFB366" transparent opacity={0.45} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ===== PARTICLES =====
function Particles() {
  const starsRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  const firefliesRef = useRef<THREE.Points>(null);
  const beamParticlesRef = useRef<THREE.Points>(null);

  const { starsGeom, dustGeom, dustVel, ffGeom, ffPhase, bpGeom, bpProgress } = useMemo(() => {
    // Stars
    const sGeom = new THREE.BufferGeometry();
    const sPos = new Float32Array(350 * 3);
    for (let i = 0; i < 350; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.8;
      const r = 40 + Math.random() * 100;
      sPos[i * 3] = Math.cos(th) * Math.sin(ph) * r;
      sPos[i * 3 + 1] = 60 + Math.cos(ph) * r;
      sPos[i * 3 + 2] = Math.sin(th) * Math.sin(ph) * r - 20;
    }
    sGeom.setAttribute('position', new THREE.BufferAttribute(sPos, 3));

    // Dust
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

    // Fireflies
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

    // Beam particles
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

    return { starsGeom: sGeom, dustGeom: dGeom, dustVel: dVel, ffGeom: fGeom, ffPhase: fPhase, bpGeom: bGeom, bpProgress: bProg };
  }, []);

  const lastTRef = useRef(0);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dt = Math.min(t - (lastTRef.current || t), 0.1);
    lastTRef.current = t;

    if (starsRef.current) {
      starsRef.current.material.opacity = 0.6 + Math.sin(t * 2.3) * 0.25 + Math.sin(t * 5.1) * 0.15;
      (starsRef.current.material as THREE.PointsMaterial).size = 1.5 + Math.sin(t * 3.1) * 0.4;
    }

    if (dustRef.current) {
      const dPos = dustGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < 250; i++) {
        dPos[i * 3] += dustVel[i * 3] * dt * 10;
        dPos[i * 3 + 1] += dustVel[i * 3 + 1] * dt * 10;
        dPos[i * 3 + 2] += dustVel[i * 3 + 2] * dt * 10;
        if (Math.abs(dPos[i * 3]) > 200) dPos[i * 3] *= -0.9;
        if (dPos[i * 3 + 1] < 2) dPos[i * 3 + 1] = 55 + Math.random() * 10;
        if (dPos[i * 3 + 1] > 60) dPos[i * 3 + 1] = 2;
        if (Math.abs(dPos[i * 3 + 2] + 40) > 200) dPos[i * 3 + 2] *= -0.9;
      }
      dustGeom.attributes.position.needsUpdate = true;
    }

    if (firefliesRef.current) {
      const fA = ffGeom.attributes.position;
      for (let i = 0; i < 20; i++) {
        fA.setZ(i, ffGeom.attributes.position.getZ(i) + Math.sin(t * 1.8 + ffPhase[i]) * 0.02);
        fA.setY(i, 5 + Math.sin(t * 1.2 + ffPhase[i]) * 2);
        fA.setX(i, ffGeom.attributes.position.getX(i) + Math.cos(t * 1.5 + ffPhase[i]) * 0.02);
      }
      fA.needsUpdate = true;
      (firefliesRef.current.material as THREE.PointsMaterial).opacity = 0.4 + Math.sin(t * 2.0) * 0.2;
    }

    if (beamParticlesRef.current) {
      const bA = bpGeom.attributes.position;
      for (let i = 0; i < 70; i++) {
        bpProgress[i] = (bpProgress[i] + dt * 0.08) % 1;
        bA.setX(i, Math.sin(t * 2 + bpProgress[i] * 10) * 1.5);
        bA.setY(i, 29.5 + bpProgress[i] * 4);
        bA.setZ(i, bpProgress[i] * 100);
      }
      bA.needsUpdate = true;
    }
  });

  return (
    <>
      <points ref={starsRef} geometry={starsGeom}>
        <pointsMaterial color="#ffffff" size={1.8} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation={false} />
      </points>
      <points ref={dustRef} geometry={dustGeom}>
        <pointsMaterial color="#475569" size={0.25} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
      <points ref={firefliesRef} geometry={ffGeom}>
        <pointsMaterial color="#bfdbfe" size={0.35} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
      <points ref={beamParticlesRef} geometry={bpGeom}>
        <pointsMaterial color="#FFE4B5" size={0.3} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
    </>
  );
}

// ===== MAIN SCENE =====
export function CityScene() {
  return (
    <>
      <SkyDome />
      <fog attach="fog" args={['#e07840', 120, 550]} />
      <ambientLight intensity={0.55} color="#3a5070" />
      <hemisphereLight intensity={0.55} color="#4a6080" groundColor="#FF8C42" />
      <directionalLight position={[50, 100, 50]} intensity={0.25} color="#8899aa" />
      <RoadGround />
      <Buildings />
      <Lighthouse />
      <Particles />
    </>
  );
}
