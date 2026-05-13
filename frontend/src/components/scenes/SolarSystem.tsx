import { useRef, useMemo } from 'react';
import { useFrame, extend, type Object3DNode } from '@react-three/fiber';
import { shaderMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';

// ── Sun fire shader — surface with domain warping ─────────────
const SunFireMaterial = shaderMaterial(
  { uTime: 0 },
  `varying vec3 vPos; varying vec3 vNorm;
   void main() {
     vPos = position;
     vNorm = normalize(normalMatrix * normal);
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  `uniform float uTime;
   varying vec3 vPos; varying vec3 vNorm;

   // ── hash / noise / fbm ──
   float hash(vec3 p) {
     p = fract(p * 0.3183099 + 0.1); p *= 17.0;
     return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
   }
   float noise(vec3 p) {
     vec3 i = floor(p), f = fract(p);
     f = f * f * (3.0 - 2.0 * f);
     return mix(
       mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
           mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
       mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
           mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
   }
   float fbm(vec3 p) {
     float v = 0.0, a = 0.5, f = 1.0;
     for (int i = 0; i < 6; i++) { v += a * noise(p * f); f *= 2.0; a *= 0.5; }
     return v;
   }

   void main() {
     float t = uTime * 0.6;
     vec3 p = vPos * 2.5;

     // Domain warping — two layers of fbm offset each other for turbulence
     vec3 q = vec3(fbm(p + t * 0.3), fbm(p + vec3(1.7, 9.2, 3.1) + t * 0.25), fbm(p + vec3(5.3, 2.8, 7.1)));
     vec3 r = vec3(fbm(p + 4.0 * q + t * 0.15), fbm(p + 4.0 * q + vec3(8.3, 2.8, 1.2)), fbm(p + 4.0 * q + vec3(3.7, 6.1, 9.4)));
     float n = fbm(p + 3.5 * r);

     float fire = n * 0.5 + 0.5;

     // Bright spots (solar flares)
     float flare = fbm(p * 4.0 + t * 1.2);
     flare = pow(max(flare, 0.0), 2.5) * 1.5;

     // Color ramp: dark red → orange → gold → white
     vec3 dark   = vec3(0.6, 0.05, 0.0);
     vec3 red    = vec3(0.9, 0.15, 0.0);
     vec3 orange = vec3(1.0, 0.45, 0.0);
     vec3 gold   = vec3(1.0, 0.8, 0.1);
     vec3 white  = vec3(1.0, 0.97, 0.85);

     vec3 col = mix(dark, red,    smoothstep(0.0, 0.2, fire));
     col = mix(col, orange, smoothstep(0.2, 0.4, fire));
     col = mix(col, gold,   smoothstep(0.4, 0.65, fire));
     col = mix(col, white,  smoothstep(0.65, 0.85, fire));
     col += flare * vec3(1.0, 0.9, 0.5);

     // Limb darkening
     float rim = 1.0 - abs(dot(vNorm, vec3(0.0, 0.0, 1.0)));
     col = mix(col, dark * 0.5, pow(rim, 2.2) * 0.6);

     gl_FragColor = vec4(col, 1.0);
   }`
);

extend({ SunFireMaterial });

type SunFireMaterialType = THREE.ShaderMaterial & { uTime: number };
declare module '@react-three/fiber' {
  interface ThreeElements {
    sunFireMaterial: Object3DNode<SunFireMaterialType, typeof SunFireMaterial>;
  }
}

// ── Sun corona shader — dynamic pulsating fire aura ────────────
const SunCoronaMaterial = shaderMaterial(
  { uTime: 0 },
  `varying vec2 vUv; varying vec3 vNorm;
   void main() {
     vUv = uv;
     vNorm = normalize(normalMatrix * normal);
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  `uniform float uTime;
   varying vec2 vUv; varying vec3 vNorm;

   float hash(vec3 p) {
     p = fract(p * 0.3183099 + 0.1); p *= 17.0;
     return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
   }
   float noise(vec3 p) {
     vec3 i = floor(p), f = fract(p);
     f = f * f * (3.0 - 2.0 * f);
     return mix(
       mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
           mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
       mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
           mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
   }
   float fbm(vec3 p) {
     float v = 0.0, a = 0.5, f = 1.0;
     for (int i = 0; i < 5; i++) { v += a * noise(p * f); f *= 2.0; a *= 0.5; }
     return v;
   }

   void main() {
     float t = uTime;
     vec3 p = vec3(vUv * 4.0, t * 0.3);

     // Animated noise for fire tendrils
     float n1 = fbm(p + vec3(t * 0.4, 0.0, t * 0.2));
     float n2 = fbm(p * 1.5 + vec3(0.0, t * 0.3, t * 0.5) + n1 * 2.0);
     float fire = n1 * 0.4 + n2 * 0.6;
     fire = fire * 0.5 + 0.5;

     // Pulsating intensity
     float pulse = 0.85 + 0.15 * sin(t * 1.5 + n1 * 3.0);

     // Radial fade — stronger at limb, fading outward
     float rim = 1.0 - abs(dot(vNorm, vec3(0.0, 0.0, 1.0)));
     float radial = smoothstep(0.0, 0.35, rim) * (1.0 - smoothstep(0.35, 1.0, rim));
     radial = pow(radial, 0.6);

     // Color: deep red → orange → bright yellow
     vec3 col = mix(vec3(0.8, 0.1, 0.0), vec3(1.0, 0.5, 0.0), smoothstep(0.3, 0.6, fire));
     col = mix(col, vec3(1.0, 0.85, 0.3), smoothstep(0.6, 0.9, fire));

     float alpha = radial * fire * pulse * 0.7;
     gl_FragColor = vec4(col, alpha);
   }`
);

extend({ SunCoronaMaterial });

type SunCoronaMaterialType = THREE.ShaderMaterial & { uTime: number };
declare module '@react-three/fiber' {
  interface ThreeElements {
    sunCoronaMaterial: Object3DNode<SunCoronaMaterialType, typeof SunCoronaMaterial>;
  }
}

// ── Star particle background ────────────────────────────────────
function Starfield() {
  const { positions, sizes } = useMemo(() => {
    const count = 2500;
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const radius = 600;
    for (let i = 0; i < count; i++) {
      // Random point in sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.6 + Math.random() * 0.4);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      siz[i] = 0.5 + Math.random() * 1.5;
    }
    return { positions: pos, sizes: siz };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [positions, sizes]);

  return (
    <points>
      <primitive object={geo} attach="geometry" />
      <pointsMaterial
        size={1.2}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ── Glow texture (radial gradient circle) ──────────────────────
function useGlowTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.1, 'rgba(255,220,100,0.9)');
    g.addColorStop(0.3, 'rgba(255,160,30,0.5)');
    g.addColorStop(0.6, 'rgba(255,80,10,0.15)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

// ── Sun with dynamic fire surface + pulsating corona ───────────
function Sun() {
  const fireMatRef = useRef<SunFireMaterialType>(null);
  const coronaMatRef = useRef<SunCoronaMaterialType>(null);
  const sprite1Ref = useRef<THREE.Sprite>(null);
  const sprite2Ref = useRef<THREE.Sprite>(null);
  const sprite3Ref = useRef<THREE.Sprite>(null);
  const glowTex = useGlowTexture();

  useFrame((_, delta) => {
    const t = (fireMatRef.current?.uTime ?? 0) + delta;
    if (fireMatRef.current) fireMatRef.current.uTime = t;
    if (coronaMatRef.current) coronaMatRef.current.uTime = t;
    if (sprite1Ref.current) {
      const s1 = 16 + Math.sin(t * 1.2) * 1.5 + Math.sin(t * 2.7) * 0.5;
      sprite1Ref.current.scale.set(s1, s1, 1);
    }
    if (sprite2Ref.current) {
      const s2 = 26 + Math.sin(t * 0.8 + 1) * 2.5 + Math.sin(t * 1.9) * 0.8;
      sprite2Ref.current.scale.set(s2, s2, 1);
    }
    if (sprite3Ref.current) {
      const s3 = 38 + Math.sin(t * 0.5 + 2) * 3 + Math.sin(t * 1.3) * 1;
      sprite3Ref.current.scale.set(s3, s3, 1);
    }
  });

  return (
    <group>
      {/* Fire surface sphere */}
      <mesh>
        <sphereGeometry args={[4, 128, 128]} />
        {/* @ts-ignore */}
        <sunFireMaterial ref={fireMatRef} attach="material" uTime={0} />
      </mesh>

      {/* Dynamic corona — inner layer (BackSide, animated fire shader) */}
      <mesh>
        <sphereGeometry args={[6.5, 96, 96]} />
        {/* @ts-ignore */}
        <sunCoronaMaterial
          ref={coronaMatRef}
          attach="material"
          uTime={0}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Pulsating sprite glow layers — circular texture map */}
      <sprite ref={sprite1Ref} scale={[16, 16, 1]}>
        <spriteMaterial
          map={glowTex}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.45}
          color="#ffcc44"
          transparent
        />
      </sprite>
      <sprite ref={sprite2Ref} scale={[26, 26, 1]}>
        <spriteMaterial
          map={glowTex}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.2}
          color="#ff8800"
          transparent
        />
      </sprite>
      <sprite ref={sprite3Ref} scale={[38, 38, 1]}>
        <spriteMaterial
          map={glowTex}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.08}
          color="#ff4400"
          transparent
        />
      </sprite>
    </group>
  );
}

// ── Orbit ring (deep blue, subtle) ──────────────────────────────
function OrbitRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }, [radius]);

  return (
    <Line
      points={points}
      color="#4466aa"
      transparent
      opacity={0.5}
      lineWidth={1}
      depthWrite={false}
    />
  );
}

// ── Procedural planet textures ────────────────────────────────
// Simple seeded PRNG for deterministic noise
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function noise2D(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = noise2D(ix, iy, seed), b = noise2D(ix + 1, iy, seed);
  const c = noise2D(ix, iy + 1, seed), d = noise2D(ix + 1, iy + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm2D(x: number, y: number, seed: number, octaves = 5): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) {
    v += a * smoothNoise(x * f, y * f, seed + i * 100);
    f *= 2; a *= 0.5;
  }
  return v;
}

type PlanetType = 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';

function createPlanetTexture(type: PlanetType): { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const w = 512, h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const u = px / w, v = py / h;
      const lon = u * Math.PI * 2, lat = v * Math.PI;
      const nx = Math.sin(lat) * Math.cos(lon);
      const ny = Math.cos(lat);
      const nz = Math.sin(lat) * Math.sin(lon);
      const idx = (py * w + px) * 4;

      let r = 0, g = 0, b = 0, er = 0, eg = 0, eb = 0, bump = 0.5;

      if (type === 'earth') {
        const continent = fbm2D(nx * 2, nz * 2 + ny, 42, 6);
        const detail = fbm2D(nx * 8, nz * 8 + ny * 3, 99, 4) * 0.15;
        const val = continent + detail;
        if (val > 0.48) {
          const alt = (val - 0.48) * 3;
          if (alt > 0.7) {
            r = 230 + (alt - 0.7) * 60; g = 230 + (alt - 0.7) * 50; b = 220 + (alt - 0.7) * 35;
            bump = 0.8;
          } else if (alt > 0.3) {
            r = 80 + alt * 80; g = 140 + alt * 60; b = 60 + alt * 30;
            bump = 0.55 + alt * 0.15;
          } else {
            r = 160 + alt * 80; g = 140 + alt * 60; b = 90 + alt * 40;
            bump = 0.5;
          }
        } else {
          const depth = (0.48 - val) * 4;
          r = 20 + depth * 10; g = 60 + depth * 30; b = 140 + depth * 60;
          bump = 0.35;
          er = 5; eg = 10; eb = 25;
        }
        const cloud = fbm2D(nx * 3 + 0.5, nz * 3 + ny + 0.5, 77, 4);
        if (cloud > 0.5) {
          const ca = (cloud - 0.5) * 1.2;
          r = r + (240 - r) * ca; g = g + (245 - g) * ca; b = b + (250 - b) * ca;
        }
      } else if (type === 'mars') {
        const base = fbm2D(nx * 2.5, nz * 2.5 + ny, 55, 5);
        const polar = Math.abs(ny);
        if (polar > 0.82) {
          r = 220 + (polar - 0.82) * 200; g = 210 + (polar - 0.82) * 200; b = 200 + (polar - 0.82) * 200;
          bump = 0.6;
        } else {
          const dark = fbm2D(nx * 6, nz * 6 + ny * 2, 88, 3) * 0.2;
          r = 180 + base * 50 - dark * 100; g = 90 + base * 30 - dark * 50; b = 50 + base * 15 - dark * 20;
          bump = 0.45 + base * 0.2;
          const canyon = Math.abs(fbm2D(nx * 10, nz * 10, 33, 3) - 0.5);
          if (canyon < 0.04) { r -= 40; g -= 25; b -= 15; bump = 0.3; }
        }
        er = 20; eg = 8; eb = 2;
      } else if (type === 'jupiter') {
        const latBand = ny * 6 + fbm2D(nx * 1.5, nz * 1.5, 11, 3) * 0.5;
        const band = Math.sin(latBand * Math.PI) * 0.5 + 0.5;
        const storm = fbm2D(nx * 4, nz * 4 + ny, 22, 4);
        const colors = [
          [200, 170, 130], [170, 140, 100], [210, 185, 150],
          [150, 120, 85], [190, 160, 120], [160, 130, 95],
        ];
        const ci = Math.floor((band * 0.99 + storm * 0.1) * colors.length) % colors.length;
        const ci2 = (ci + 1) % colors.length;
        const t = (band * colors.length) % 1;
        r = colors[ci][0] + (colors[ci2][0] - colors[ci][0]) * t;
        g = colors[ci][1] + (colors[ci2][1] - colors[ci][1]) * t;
        b = colors[ci][2] + (colors[ci2][2] - colors[ci][2]) * t;
        const grsU = 0.25, grsV = 0.6, grsR = 0.06;
        const du = Math.min(Math.abs(u - grsU), 1 - Math.abs(u - grsU));
        const dv = v - grsV;
        if (du * du + dv * dv < grsR * grsR) {
          r = 200; g = 100; b = 70;
        }
        bump = 0.4 + storm * 0.2;
        er = 10; eg = 6; eb = 2;
      } else if (type === 'saturn') {
        const latBand = ny * 8 + fbm2D(nx * 1.2, nz * 1.2, 33, 3) * 0.3;
        const band = Math.sin(latBand * Math.PI) * 0.5 + 0.5;
        const colors = [
          [220, 200, 160], [200, 180, 140], [230, 210, 170],
          [190, 170, 130], [210, 195, 155],
        ];
        const ci = Math.floor(band * colors.length * 0.99);
        r = colors[ci % colors.length][0]; g = colors[ci % colors.length][1]; b = colors[ci % colors.length][2];
        bump = 0.4 + band * 0.1;
        er = 8; eg = 6; eb = 3;
      } else if (type === 'venus') {
        const cloud = fbm2D(nx * 2, nz * 2 + ny, 66, 5);
        const swirl = fbm2D(nx * 4 + 1, nz * 4 + ny, 77, 3);
        r = 210 + cloud * 30 + swirl * 10; g = 180 + cloud * 20 + swirl * 10; b = 130 + cloud * 15;
        bump = 0.4 + cloud * 0.3;
        er = 15; eg = 10; eb = 3;
      } else if (type === 'mercury') {
        const base = fbm2D(nx * 3, nz * 3 + ny, 11, 5);
        const crater = fbm2D(nx * 12, nz * 12 + ny * 4, 22, 3);
        const tone = 130 + base * 50;
        r = tone - crater * 30; g = tone - crater * 30 - 5; b = tone - crater * 30 - 10;
        bump = 0.3 + crater * 0.4;
        er = 5; eg = 4; eb = 3;
      } else if (type === 'uranus') {
        const haze = fbm2D(nx * 1.5, nz * 1.5 + ny, 44, 3);
        r = 140 + haze * 20; g = 200 + haze * 15; b = 220 + haze * 10;
        bump = 0.45;
        er = 5; eg = 12; eb = 18;
      } else if (type === 'neptune') {
        const storm = fbm2D(nx * 3, nz * 3 + ny, 55, 4);
        r = 40 + storm * 20; g = 80 + storm * 30; b = 180 + storm * 40;
        const spotU = 0.6, spotV = 0.45, spotR = 0.05;
        const du2 = Math.min(Math.abs(u - spotU), 1 - Math.abs(u - spotU));
        const dv2 = v - spotV;
        if (du2 * du2 + dv2 * dv2 < spotR * spotR) { r = 30; g = 60; b = 150; }
        bump = 0.4 + storm * 0.25;
        er = 5; eg = 10; eb = 30;
      }

      d[idx] = Math.min(255, Math.max(0, r));
      d[idx + 1] = Math.min(255, Math.max(0, g));
      d[idx + 2] = Math.min(255, Math.max(0, b));
      d[idx + 3] = 255;

      if (er + eg + eb > 0) {
        const eCanvas = canvas; // we'll build emissive separately
      }
    }
  }

  ctx.putImageData(img, 0, 0);
  const map = new THREE.CanvasTexture(canvas);
  map.needsUpdate = true;

  // Emissive map
  const eCanvas = document.createElement('canvas');
  eCanvas.width = w; eCanvas.height = h;
  const eCtx = eCanvas.getContext('2d')!;
  const eImg = eCtx.createImageData(w, h);
  const ed = eImg.data;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const u2 = px / w, v2 = py / h;
      const lon2 = u2 * Math.PI * 2, lat2 = v2 * Math.PI;
      const nx2 = Math.sin(lat2) * Math.cos(lon2);
      const ny2 = Math.cos(lat2);
      const nz2 = Math.sin(lat2) * Math.sin(lon2);
      const idx2 = (py * w + px) * 4;
      let er2 = 0, eg2 = 0, eb2 = 0;
      if (type === 'earth') {
        const cont = fbm2D(nx2 * 2, nz2 * 2 + ny2, 42, 6);
        if (cont <= 0.48) { er2 = 5; eg2 = 12; eb2 = 30; }
      } else if (type === 'mars') { er2 = 25; eg2 = 10; eb2 = 3; }
      else if (type === 'jupiter') { er2 = 12; eg2 = 8; eb2 = 3; }
      else if (type === 'saturn') { er2 = 10; eg2 = 8; eb2 = 4; }
      else if (type === 'venus') { er2 = 18; eg2 = 12; eb2 = 4; }
      else if (type === 'mercury') { er2 = 6; eg2 = 5; eb2 = 4; }
      else if (type === 'uranus') { er2 = 6; eg2 = 15; eb2 = 22; }
      else if (type === 'neptune') { er2 = 6; eg2 = 12; eb2 = 35; }
      ed[idx2] = er2; ed[idx2 + 1] = eg2; ed[idx2 + 2] = eb2; ed[idx2 + 3] = 255;
    }
  }
  eCtx.putImageData(eImg, 0, 0);
  const emissiveMap = new THREE.CanvasTexture(eCanvas);
  emissiveMap.needsUpdate = true;

  // Bump map
  const bCanvas = document.createElement('canvas');
  bCanvas.width = w; bCanvas.height = h;
  const bCtx = bCanvas.getContext('2d')!;
  const bImg = bCtx.createImageData(w, h);
  const bd = bImg.data;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const u3 = px / w, v3 = py / h;
      const lon3 = u3 * Math.PI * 2, lat3 = v3 * Math.PI;
      const nx3 = Math.sin(lat3) * Math.cos(lon3);
      const ny3 = Math.cos(lat3);
      const nz3 = Math.sin(lat3) * Math.sin(lon3);
      const idx3 = (py * w + px) * 4;
      let bv = 128;
      if (type === 'earth') {
        const c = fbm2D(nx3 * 2, nz3 * 2 + ny3, 42, 6);
        const det = fbm2D(nx3 * 10, nz3 * 10 + ny3 * 4, 99, 3) * 0.15;
        bv = c > 0.48 ? 140 + (c - 0.48) * 200 + det * 100 : 100 - (0.48 - c) * 80;
      } else if (type === 'mars') {
        bv = 100 + fbm2D(nx3 * 6, nz3 * 6 + ny3 * 2, 55, 4) * 120;
      } else if (type === 'jupiter' || type === 'saturn') {
        bv = 100 + fbm2D(nx3 * 4, nz3 * 4 + ny3, 22, 3) * 80;
      } else if (type === 'mercury') {
        const cr = fbm2D(nx3 * 15, nz3 * 15 + ny3 * 5, 22, 3);
        bv = 100 + cr * 100;
      } else { bv = 128 + fbm2D(nx3 * 3, nz3 * 3 + ny3, 44, 3) * 40; }
      bd[idx3] = bd[idx3 + 1] = bd[idx3 + 2] = Math.min(255, Math.max(0, bv));
      bd[idx3 + 3] = 255;
    }
  }
  bCtx.putImageData(bImg, 0, 0);
  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.needsUpdate = true;

  return { map, emissiveMap, bumpMap };
}

function usePlanetTextures(type: PlanetType) {
  return useMemo(() => createPlanetTexture(type), [type]);
}

// ── Planet ──────────────────────────────────────────────────────
interface PlanetProps {
  type: PlanetType;
  radius: number;
  orbitRadius: number;
  speed: number;
  rotSpeed?: number;
  hasRing?: boolean;
  ringColor?: string;
  ringInner?: number;
  ringOuter?: number;
  ringOpacity?: number;
}

function Planet({
  type, radius, orbitRadius, speed,
  rotSpeed = 1.5,
  hasRing, ringColor, ringInner, ringOuter, ringOpacity = 0.75,
}: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const { map, emissiveMap, bumpMap } = usePlanetTextures(type);

  useFrame((_, delta) => {
    if (orbitRef.current) orbitRef.current.rotation.y += delta * speed;
    if (meshRef.current) meshRef.current.rotation.y += delta * rotSpeed;
  });

  return (
    <group ref={orbitRef}>
      <mesh ref={meshRef} position={[orbitRadius, 0, 0]}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={map}
          emissiveMap={emissiveMap}
          emissive="#ffffff"
          emissiveIntensity={0.3}
          bumpMap={bumpMap}
          bumpScale={0.5}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {hasRing && (
        <group position={[orbitRadius, 0, 0]} rotation={[Math.PI / 2.5, 0.3, 0]}>
          <mesh>
            <ringGeometry args={[ringInner!, ringOuter!, 96]} />
            <meshStandardMaterial
              color={ringColor}
              side={THREE.DoubleSide}
              roughness={0.5}
              metalness={0.08}
              transparent
              opacity={ringOpacity}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── Main SolarSystem ────────────────────────────────────────────
export function SolarSystem() {
  return (
    <group>
      {/* Lighting — sun point light only, no ambient */}
      <pointLight
        position={[0, 0, 0]}
        intensity={180}
        distance={300}
        decay={1.6}
        color="#ffe0b0"
      />

      {/* Deep space starfield background */}
      <Starfield />

      <Sun />

      {/* Orbit rings — deep blue, subtle */}
      {[8, 13, 18, 23, 30, 38, 46, 54].map((r) => (
        <OrbitRing key={r} radius={r} />
      ))}

      {/* Planets — ordered from sun outward */}
      <Planet type="mercury" radius={0.3}  orbitRadius={8}  speed={0.20} rotSpeed={0.6} />
      <Planet type="venus"   radius={0.8}  orbitRadius={13} speed={0.15} rotSpeed={0.4} />
      <Planet type="earth"   radius={0.85} orbitRadius={18} speed={0.12} rotSpeed={1.0} />
      <Planet type="mars"    radius={0.5}  orbitRadius={23} speed={0.09} rotSpeed={0.9} />
      <Planet type="jupiter" radius={2.8}  orbitRadius={30} speed={0.05} rotSpeed={1.8} />
      <Planet
        type="saturn" radius={2.2} orbitRadius={38}
        speed={0.035} rotSpeed={1.2}
        hasRing ringColor="#d4c498" ringInner={3.0} ringOuter={5.0} ringOpacity={0.65}
      />
      <Planet type="uranus"  radius={1.6}  orbitRadius={46} speed={0.025} rotSpeed={0.8} />
      <Planet type="neptune" radius={1.4}  orbitRadius={54} speed={0.018} rotSpeed={0.7} />
    </group>
  );
}
