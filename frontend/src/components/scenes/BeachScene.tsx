import { useRef, useMemo, useCallback, useState } from 'react';
import { useFrame, useThree, extend, type Object3DNode } from '@react-three/fiber';
import { OrbitControls, shaderMaterial, Sky } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ── GLSL Noise Library ───────────────────────────────────────────
const glslNoise = `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1); p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise2(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    return a + (b - a) * f.x + (c - a) * f.y + (a - b - c + d) * f.x * f.y;
  }
  float fbm2(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise2(p); p *= 2.0; a *= 0.5; }
    return v;
  }
`;

// ── Ocean Shader — Gerstner Waves with Analytical Normals ────────
const OceanMaterial = shaderMaterial(
  {
    uTime: 0,
    uSunDir: new THREE.Vector3(0.6, 0.75, 0.25).normalize(),
    uSunColor: new THREE.Color('#fff8e7'),
    uDeepColor: new THREE.Color('#0a4b6e'),
    uShallowColor: new THREE.Color('#20a0b0'),
    uFoamColor: new THREE.Color('#ffffff'),
    uFresnelPower: 4.0,
    uWaveSpeed: 1.0,
    uRippleOrigin: new THREE.Vector3(0, 0, 0),
    uRippleTime: -1,
  },
  // Vertex Shader
  `uniform float uTime;
   uniform float uWaveSpeed;
   uniform vec3 uRippleOrigin;
   uniform float uRippleTime;

   varying vec3 vWorldPos;
   varying vec3 vNormal;
   varying float vHeight;
   varying vec2 vUv;
   varying float vFoam;

   ${glslNoise}

   // ── Gerstner Wave with analytical derivatives ──
   struct Wave {
     float steepness;
     float wavelength;
     vec2 direction;
   };

   vec3 gerstnerWave(vec3 pos, Wave w, float time, out vec3 ddx_out, out vec3 ddz_out) {
     float k = 6.28318530718 / w.wavelength;
     float c = sqrt(9.8 / k);
     vec2 d = normalize(w.direction);
     float f = k * (dot(d, pos.xz) - c * time);
     float a = w.steepness / k;

     float cosf = cos(f);
     float sinf = sin(f);

     vec3 p = vec3(
       d.x * a * cosf,
       a * sinf,
       d.y * a * cosf
     );

     // Derivatives for normal calculation
     float dk = k * a;
     ddx_out = vec3(
       -d.x * d.x * dk * sinf,
       d.x * dk * cosf,
       -d.x * d.y * dk * sinf
     );
     ddz_out = vec3(
       -d.x * d.y * dk * sinf,
       d.y * dk * cosf,
       -d.y * d.y * dk * sinf
     );

     return p;
   }

   void main() {
     vec3 pos = position;
     vec2 uv = position.xz * 0.01;
     vUv = uv;

     Wave waves[5];
     waves[0] = Wave(0.22, 55.0, vec2(1.0, 0.3));
     waves[1] = Wave(0.15, 32.0, vec2(0.7, 0.8));
     waves[2] = Wave(0.10, 18.0, vec2(-0.4, 0.9));
     waves[3] = Wave(0.06, 10.0, vec2(0.5, -0.5));
     waves[4] = Wave(0.04, 5.5, vec2(-0.8, -0.3));

     vec3 totalWave = vec3(0.0);
     vec3 totalDdx = vec3(0.0);
     vec3 totalDdz = vec3(0.0);

     float t = uTime * uWaveSpeed;

     for (int i = 0; i < 5; i++) {
       vec3 ddx_i, ddz_i;
       totalWave += gerstnerWave(pos, waves[i], t, ddx_i, ddz_i);
       totalDdx += ddx_i;
       totalDdz += ddz_i;
     }

     pos += totalWave;

     // ── Ripple effect from click ──
     float rippleOffset = 0.0;
     if (uRippleTime > 0.0) {
       float dist = distance(position.xz, uRippleOrigin.xz);
       float rippleAge = uTime - uRippleTime;
       float rippleRadius = rippleAge * 20.0;
       float rippleWidth = 4.0;
       float rippleFalloff = exp(-rippleAge * 0.8);
       float ripple = smoothstep(rippleRadius - rippleWidth, rippleRadius, dist) *
                      smoothstep(rippleRadius + rippleWidth, rippleRadius, dist);
       rippleOffset = ripple * 2.5 * rippleFalloff;
       pos.y += rippleOffset;

       // Derivative of ripple for normal
       float rippleDerivative = rippleFalloff * 2.5 * (
         smoothstep(rippleRadius - rippleWidth, rippleRadius, dist) * (-1.0 / rippleWidth) +
         smoothstep(rippleRadius + rippleWidth, rippleRadius, dist) * (1.0 / rippleWidth)
       );
       totalDdx.y += rippleDerivative * (pos.x - uRippleOrigin.x) / max(dist, 0.01);
       totalDdz.y += rippleDerivative * (pos.z - uRippleOrigin.z) / max(dist, 0.01);
     }

     vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
     vHeight = pos.y;

     // Analytical normal from wave derivatives
     vec3 tangent = vec3(1.0, 0.0, 0.0) + totalDdx;
     vec3 bitangent = vec3(0.0, 0.0, 1.0) + totalDdz;
     vNormal = normalize(cross(bitangent, tangent));

     // Foam based on wave steepness (derivative magnitude)
     float steepness = length(totalDdx) + length(totalDdz);
     vFoam = smoothstep(0.25, 0.55, steepness) + smoothstep(0.8, 1.5, vHeight) * 0.5;

     gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
   }`,
  // Fragment Shader
  `uniform float uTime;
   uniform vec3 uSunDir;
   uniform vec3 uSunColor;
   uniform vec3 uDeepColor;
   uniform vec3 uShallowColor;
   uniform vec3 uFoamColor;
   uniform float uFresnelPower;

   varying vec3 vWorldPos;
   varying vec3 vNormal;
   varying float vHeight;
   varying vec2 vUv;
   varying float vFoam;

   ${glslNoise}

   void main() {
     vec3 viewDir = normalize(cameraPosition - vWorldPos);
     vec3 normal = normalize(vNormal);

     // ── Fresnel reflection ──
     float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);

     // ── Subsurface scattering (SSS) ──
     // Light passing through water from behind
     float viewSunDot = dot(viewDir, -uSunDir);
     float sss = pow(max(viewSunDot, 0.0), 3.0) * 0.4;

     // ── Water depth coloring ──
     // Height-based blend: negative = deep, positive = shallow
     float depthFactor = smoothstep(-3.0, 2.0, vHeight);
     vec3 waterColor = mix(uDeepColor, uShallowColor, depthFactor);

     // Add some procedural variation
     float waterNoise = fbm2(vUv * 8.0 + uTime * 0.05) * 0.08;
     waterColor += waterNoise;

     // ── Sun specular highlight (Blinn-Phong with high exponent) ──
     vec3 halfDir = normalize(uSunDir + viewDir);
     float NdotH = max(dot(normal, halfDir), 0.0);
     float spec = pow(NdotH, 512.0);

     // Glitter / sparkles on wave peaks
     float sparkle = pow(NdotH, 2048.0) * smoothstep(0.0, 1.0, vHeight);

     vec3 specular = uSunColor * spec * 2.0;
     vec3 sparkleCol = vec3(1.0, 0.98, 0.92) * sparkle * 3.0;

     // ── Combine ──
     vec3 color = waterColor;

     // Fresnel makes shallow water brighter at glancing angles
     color = mix(color, uShallowColor * 1.4 + vec3(0.1), fresnel * 0.6);

     // SSS adds warm translucency
     color += sss * vec3(0.15, 0.25, 0.2);

     // Specular highlights
     color += specular;
     color += sparkleCol;

     // ── Foam at wave peaks ──
     float foamNoise = noise2(vUv * 40.0 + uTime * 0.3);
     float foamMask = vFoam * (0.7 + foamNoise * 0.3);
     color = mix(color, uFoamColor, clamp(foamMask, 0.0, 1.0) * 0.75);

     // ── Alpha ──
     float alpha = 0.88 + fresnel * 0.12;

     gl_FragColor = vec4(color, alpha);
   }`
);

extend({ OceanMaterial });

type OceanMaterialType = THREE.ShaderMaterial & {
  uTime: number;
  uSunDir: THREE.Vector3;
  uSunColor: THREE.Color;
  uDeepColor: THREE.Color;
  uShallowColor: THREE.Color;
  uFoamColor: THREE.Color;
  uFresnelPower: number;
  uWaveSpeed: number;
  uRippleOrigin: THREE.Vector3;
  uRippleTime: number;
};

declare module '@react-three/fiber' {
  interface ThreeElements {
    oceanMaterial: Object3DNode<OceanMaterialType, typeof OceanMaterial>;
  }
}

// ── Sand Shader — Procedural noise texture with wet/dry mix ──────
const SandMaterial = shaderMaterial(
  {
    uTime: 0,
    uDryColor: new THREE.Color('#f5e6c8'),
    uWetColor: new THREE.Color('#8b7355'),
    uWaterLevel: 0.0,
    uTransitionWidth: 8.0,
  },
  `varying vec3 vWorldPos;
   varying vec2 vUv;
   varying float vDistanceToWater;
   varying vec3 vNormal;

   ${glslNoise}

   void main() {
     vec4 wp = modelMatrix * vec4(position, 1.0);
     vWorldPos = wp.xyz;
     vUv = uv;
     vNormal = normalize(normalMatrix * normal);

     // Distance to water level (z in local space determines shoreline)
     vDistanceToWater = position.z - uWaterLevel;

     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  `uniform float uTime;
   uniform vec3 uDryColor;
   uniform vec3 uWetColor;
   uniform float uWaterLevel;
   uniform float uTransitionWidth;

   varying vec3 vWorldPos;
   varying vec2 vUv;
   varying float vDistanceToWater;
   varying vec3 vNormal;

   ${glslNoise}

   void main() {
     // ── Wet/Dry mix based on distance to water ──
     float wetness = 1.0 - smoothstep(0.0, uTransitionWidth, vDistanceToWater);
     wetness = clamp(wetness, 0.0, 1.0);

     // ── Procedural sand grain texture ──
     float grain = noise2(vUv * 200.0) * 0.5 + noise2(vUv * 80.0) * 0.3;
     float largeNoise = fbm2(vUv * 15.0) * 0.15;

     // ── Base color ──
     vec3 dryCol = uDryColor + grain * 0.08 + largeNoise;
     vec3 wetCol = uWetColor + grain * 0.05 + largeNoise * 0.5;

     vec3 color = mix(dryCol, wetCol, wetness);

     // ── Wet sand gets specular highlight (mirror-like) ──
     vec3 viewDir = normalize(cameraPosition - vWorldPos);
     vec3 sunDir = normalize(vec3(0.6, 0.75, 0.25));
     vec3 halfDir = normalize(sunDir + viewDir);
     float spec = pow(max(dot(normalize(vNormal), halfDir), 0.0), 64.0);
     color += vec3(0.4, 0.35, 0.25) * spec * wetness * 1.5;

     // ── Add some moisture darkening near water ──
     color *= 1.0 - wetness * 0.15;

     gl_FragColor = vec4(color, 1.0);
   }`
);

extend({ SandMaterial });

type SandMaterialType = THREE.ShaderMaterial & {
  uTime: number;
  uDryColor: THREE.Color;
  uWetColor: THREE.Color;
  uWaterLevel: number;
  uTransitionWidth: number;
};

declare module '@react-three/fiber' {
  interface ThreeElements {
    sandMaterial: Object3DNode<SandMaterialType, typeof SandMaterial>;
  }
}

// ── Noise helpers (JS side) ──────────────────────────────────────
function hash2D(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise2D(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2D(ix, iy), b = hash2D(ix + 1, iy);
  const c = hash2D(ix, iy + 1), d = hash2D(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm2D(x: number, y: number, octaves = 5): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) {
    v += a * smoothNoise2D(x * f, y * f);
    f *= 2; a *= 0.5;
  }
  return v;
}

// ── Ocean Component ──────────────────────────────────────────────
function Ocean({ onPointerDown }: { onPointerDown?: (point: THREE.Vector3) => void }) {
  const matRef = useRef<OceanMaterialType>(null);
  const [rippleOrigin, setRippleOrigin] = useState(new THREE.Vector3(0, 0, 0));
  const [rippleTime, setRippleTime] = useState(-1);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uTime = clock.getElapsedTime();
    }
  });

  const handleClick = useCallback((e: { point: THREE.Vector3 }) => {
    if (e.point) {
      setRippleOrigin(e.point.clone());
      setRippleTime(matRef.current?.uTime ?? 0);
      onPointerDown?.(e.point.clone());
    }
  }, [onPointerDown]);

  // 150x150 mesh for performance (was 256x256)
  const geometry = useMemo(() => new THREE.PlaneGeometry(600, 600, 150, 150), []);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      onPointerDown={handleClick}
      geometry={geometry}
    >
      {/* @ts-ignore */}
      <oceanMaterial
        ref={matRef}
        attach="material"
        transparent
        side={THREE.DoubleSide}
        uRippleOrigin={rippleOrigin}
        uRippleTime={rippleTime}
      />
    </mesh>
  );
}

// ── Physical Sky (drei Sky) ──────────────────────────────────────
function BeachSky() {
  const sunPosition = useMemo(() => new THREE.Vector3(100, 40, 50), []);

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={sunPosition}
        inclination={0.52}
        azimuth={0.25}
        turbidity={8}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      {/* Sun glow sprite */}
      <mesh position={sunPosition.clone().normalize().multiplyScalar(400)}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial
          color="#ffe8cc"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// ── Sun Light ────────────────────────────────────────────────────
function SunLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  return (
    <directionalLight
      ref={lightRef}
      position={[100, 80, 50]}
      intensity={2.5}
      color="#fff5e0"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={0.5}
      shadow-camera-far={500}
      shadow-camera-left={-200}
      shadow-camera-right={200}
      shadow-camera-top={200}
      shadow-camera-bottom={-200}
      shadow-bias={-0.0005}
    />
  );
}

// ── Beach Terrain — Procedural with noise-based shoreline ────────
function BeachTerrain() {
  const matRef = useRef<SandMaterialType>(null);
  const { geometry } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(400, 400, 160, 160);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i); // Y in plane becomes Z in world after rotation

      // Noise-based irregular shoreline
      const shorelineNoise = fbm2D(x * 0.03, z * 0.03, 4) * 12;
      const waterLine = 5 + shorelineNoise;

      let height = 0;

      if (z < waterLine - 15) {
        // Dry sand — gentle dunes
        const duneHeight = fbm2D(x * 0.04, z * 0.04, 5) * 2.5;
        const slope = (waterLine - 15 - z) * 0.04;
        height = slope + duneHeight;
      } else if (z < waterLine + 3) {
        // Wet sand / shoreline — very flat
        const microBump = fbm2D(x * 0.1, z * 0.1, 3) * 0.15;
        height = -(z - waterLine + 15) * 0.015 + microBump;
      } else {
        // Underwater sand slope
        height = -0.8 - (z - waterLine) * 0.03;
      }

      // Small detail noise everywhere
      height += smoothNoise2D(x * 0.5, z * 0.5) * 0.08;

      pos.setZ(i, height);
    }

    geo.computeVertexNormals();
    return { geometry: geo };
  }, []);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uTime = clock.getElapsedTime();
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 30]} receiveShadow castShadow>
      <primitive object={geometry} attach="geometry" />
      {/* @ts-ignore */}
      <sandMaterial
        ref={matRef}
        attach="material"
        uWaterLevel={5}
        uTransitionWidth={10}
      />
    </mesh>
  );
}

// ── Rock — low poly with vertex displacement ─────────────────────
function Rock({ position, scale, seed = 0 }: {
  position: [number, number, number];
  scale: number;
  seed?: number;
}) {
  const geo = useMemo(() => {
    const g = new THREE.DodecahedronGeometry(1, 1);
    const pos = g.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const n = fbm2D((x + seed) * 3, (z + seed) * 3) * 0.35;
      pos.setX(i, x + n);
      pos.setY(i, y + n * 0.4);
      pos.setZ(i, z + n);
    }

    g.computeVertexNormals();
    return g;
  }, [seed]);

  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <primitive object={geo} attach="geometry" />
      <meshStandardMaterial
        color="#7a7a7a"
        roughness={0.92}
        metalness={0.08}
        flatShading
      />
    </mesh>
  );
}

// ── Rocks Group ──────────────────────────────────────────────────
function Rocks() {
  const rocks = useMemo(() => {
    const result: { pos: [number, number, number]; scale: number; seed: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.8 - 0.4;
      const dist = 35 + Math.random() * 35;
      result.push({
        pos: [
          Math.cos(angle) * dist,
          0.4 + Math.random() * 0.4,
          Math.sin(angle) * dist,
        ],
        scale: 0.8 + Math.random() * 2.5,
        seed: i * 137.5,
      });
    }
    return result;
  }, []);

  return (
    <>
      {rocks.map((rock, i) => (
        <Rock key={i} position={rock.pos} scale={rock.scale} seed={rock.seed} />
      ))}
    </>
  );
}

// ── Palm Tree ────────────────────────────────────────────────────
function PalmTree({ position }: { position: [number, number, number] }) {
  const trunkRef = useRef<THREE.Group>(null);
  const leavesRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (trunkRef.current && leavesRef.current) {
      const t = clock.getElapsedTime();
      const windStrength = 0.5 + Math.sin(t * 0.2) * 0.3; // Varying wind
      trunkRef.current.rotation.z = Math.sin(t * 0.6 + position[0] * 0.1) * 0.025 * windStrength;
      trunkRef.current.rotation.x = Math.sin(t * 0.4 + position[2] * 0.1) * 0.015 * windStrength;
      leavesRef.current.rotation.z = Math.sin(t * 0.8 + position[0] * 0.1) * 0.06 * windStrength;
      leavesRef.current.rotation.x = Math.sin(t * 0.5 + position[2] * 0.1) * 0.04 * windStrength;
    }
  });

  const trunkSegments = useMemo(() => {
    const segments: { pos: THREE.Vector3; rot: number }[] = [];
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.4, 3.5, 0),
      new THREE.Vector3(-0.2, 7.5, 0),
      new THREE.Vector3(0.15, 11, 0)
    );

    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const point = curve.getPoint(t);
      segments.push({
        pos: point,
        rot: Math.atan2(point.x, point.y) * 0.08,
      });
    }
    return segments;
  }, []);

  const leaves = useMemo(() => {
    const result: { rot: number; tilt: number; length: number }[] = [];
    for (let i = 0; i < 9; i++) {
      result.push({
        rot: (i / 9) * Math.PI * 2,
        tilt: 0.25 + Math.random() * 0.35,
        length: 3.5 + Math.random() * 1.5,
      });
    }
    return result;
  }, []);

  return (
    <group position={position}>
      {/* Trunk */}
      <group ref={trunkRef}>
        {trunkSegments.map((seg, i) => (
          <mesh key={i} position={seg.pos} rotation={[0, 0, seg.rot]} castShadow>
            <cylinderGeometry args={[0.12 - i * 0.008, 0.18 - i * 0.008, 1.1, 8]} />
            <meshStandardMaterial color="#7a6040" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Leaves */}
      <group ref={leavesRef} position={[0.15, 11, 0]}>
        {leaves.map((leaf, i) => (
          <group key={i} rotation={[0, leaf.rot, 0]}>
            <mesh rotation={[leaf.tilt, 0, 0]} position={[0, 0.3, 0]} castShadow>
              <planeGeometry args={[0.25, leaf.length]} />
              <meshStandardMaterial
                color="#2d8a3e"
                roughness={0.75}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

        {/* Coconuts */}
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh
            key={`coconut-${i}`}
            position={[
              Math.cos(i * 2.1) * 0.4,
              -0.2,
              Math.sin(i * 2.1) * 0.4,
            ]}
          >
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#6b4226" roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ── Palm Trees Group ─────────────────────────────────────────────
function PalmTrees() {
  const positions = useMemo<[number, number, number][]>(() => [
    [-45, 0, -65],
    [-32, 0, -78],
    [-55, 0, -58],
    [42, 0, -70],
    [58, 0, -55],
    [28, 0, -82],
    [-18, 0, -88],
    [22, 0, -92],
    [-65, 0, -48],
    [65, 0, -62],
  ], []);

  return (
    <>
      {positions.map((pos, i) => (
        <PalmTree key={i} position={pos} />
      ))}
    </>
  );
}

// ── Seagull ──────────────────────────────────────────────────────
function Seagull({ offset }: { offset: number }) {
  const ref = useRef<THREE.Group>(null);
  const wingRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current || !wingRef.current) return;
    const t = clock.getElapsedTime() + offset;

    // Figure-8 flight path
    const speed = 0.25;
    const radius = 35;
    const x = Math.sin(t * speed) * radius;
    const z = Math.sin(t * speed * 2) * radius * 0.5;
    const y = 28 + Math.sin(t * 0.4) * 6;

    ref.current.position.set(x, y, z);

    // Face direction of movement
    const dx = Math.cos(t * speed) * radius * speed;
    const dz = Math.cos(t * speed * 2) * radius * speed * 2;
    ref.current.rotation.y = Math.atan2(dx, dz);

    // Wing flapping
    const flapSpeed = 3.5;
    wingRef.current.rotation.x = Math.sin(t * flapSpeed) * 0.45;
  });

  return (
    <group ref={ref}>
      <mesh>
        <coneGeometry args={[0.25, 1.3, 4]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.6} />
      </mesh>
      <group ref={wingRef}>
        <mesh position={[-0.9, 0, 0]} rotation={[0, 0, Math.PI / 5]}>
          <planeGeometry args={[1.6, 0.35]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.9, 0, 0]} rotation={[0, 0, -Math.PI / 5]}>
          <planeGeometry args={[1.6, 0.35]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh position={[0, 0.1, 0.55]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Seagulls() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <Seagull key={i} offset={i * 1.8} />
      ))}
    </>
  );
}

// ── Jumping Fish ─────────────────────────────────────────────────
function JumpingFish({ seed = 0 }: { seed?: number }) {
  const ref = useRef<THREE.Group>(null);
  const timeRef = useRef(seed * 1.3);
  const nextJumpRef = useRef(seed * 2);
  const jumpPhaseRef = useRef(0);
  const startPosRef = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!ref.current) return;
    timeRef.current += delta;

    if (timeRef.current > nextJumpRef.current) {
      nextJumpRef.current = timeRef.current + 3 + Math.random() * 6;
      jumpPhaseRef.current = 0;
      startPosRef.current.set(
        (Math.random() - 0.5) * 80,
        -0.5,
        (Math.random() - 0.5) * 40 + 15,
      );
    }

    if (jumpPhaseRef.current < 1) {
      jumpPhaseRef.current += delta * 0.7;
      const t = jumpPhaseRef.current;
      const height = 10 * (1.0 - (2.0 * t - 1.0) * (2.0 * t - 1.0));

      ref.current.position.set(
        startPosRef.current.x + t * 12,
        startPosRef.current.y + height,
        startPosRef.current.z,
      );

      ref.current.rotation.z = Math.atan2(10 * (-4 * t + 2), 12);
      ref.current.visible = true;
    } else {
      ref.current.visible = false;
    }
  });

  return (
    <group ref={ref} visible={false}>
      <mesh>
        <sphereGeometry args={[0.45, 8, 6]} />
        <meshStandardMaterial color="#b8c8d8" roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.25, 0.7, 4]} />
        <meshStandardMaterial color="#b8c8d8" roughness={0.25} metalness={0.5} />
      </mesh>
    </group>
  );
}

function FishGroup() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <JumpingFish key={i} seed={i} />
      ))}
    </>
  );
}

// ── Foam Particles — GPU-optimized with reduced count ────────────
function FoamParticles() {
  const ref = useRef<THREE.Points>(null);

  const { geometry, phases } = useMemo(() => {
    const count = 300; // Reduced from 500
    const positions = new Float32Array(count * 3);
    const ph = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 0.3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80 + 10;
      ph[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    return { geometry: geo, phases: ph };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const pos = geometry.attributes.position.array as Float32Array;

    // Batch update — only update Y position
    for (let i = 0; i < phases.length; i++) {
      const x = pos[i * 3];
      const z = pos[i * 3 + 2];
      pos[i * 3 + 1] = Math.sin(t * 0.5 + x * 0.08 + z * 0.08 + phases[i]) * 0.25 + 0.15;
    }

    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color="#ffffff"
        size={0.35}
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ── Splash Particles — Object-pooled, pre-allocated ──────────────
function SplashParticles({ origin, active }: { origin: THREE.Vector3; active: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array>(new Float32Array(0));
  const lifeRef = useRef<Float32Array>(new Float32Array(0));

  const geometry = useMemo(() => {
    const count = 40;
    const positions = new Float32Array(count * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Initialize velocities and life on activation
  useMemo(() => {
    if (!active) return;
    const count = 40;
    velocitiesRef.current = new Float32Array(count * 3);
    lifeRef.current = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      velocitiesRef.current[i * 3] = Math.cos(angle) * speed;
      velocitiesRef.current[i * 3 + 1] = 6 + Math.random() * 10;
      velocitiesRef.current[i * 3 + 2] = Math.sin(angle) * speed;
      lifeRef.current[i] = 1.0 + Math.random() * 0.5;
    }
  }, [active, origin.x, origin.y, origin.z]);

  useFrame((_, delta) => {
    if (!ref.current || !active) return;

    const pos = geometry.attributes.position.array as Float32Array;
    const count = 40;
    let aliveCount = 0;

    for (let i = 0; i < count; i++) {
      lifeRef.current[i] -= delta;

      if (lifeRef.current[i] > 0) {
        pos[i * 3] += velocitiesRef.current[i * 3] * delta;
        pos[i * 3 + 1] += velocitiesRef.current[i * 3 + 1] * delta;
        pos[i * 3 + 2] += velocitiesRef.current[i * 3 + 2] * delta;
        velocitiesRef.current[i * 3 + 1] -= 12.0 * delta;
        aliveCount++;
      } else {
        pos[i * 3] = 0;
        pos[i * 3 + 1] = -100; // Hide below water
        pos[i * 3 + 2] = 0;
      }
    }

    geometry.attributes.position.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={ref} position={origin}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial
        color="#ffffff"
        size={0.25}
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ── Ripple Effect — Expand + fade ring ───────────────────────────
function RippleMesh({ origin, startTime }: { origin: THREE.Vector3; startTime: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const age = clock.getElapsedTime() - startTime;

    const scale = 1 + age * 12;
    const opacity = Math.max(0, 1 - age * 0.6) * 0.4;

    ref.current.scale.setScalar(scale);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    ref.current.visible = opacity > 0.01;
  });

  return (
    <mesh ref={ref} position={origin} rotation={[-Math.PI / 2, 0, 0]} visible>
      <ringGeometry args={[0.7, 0.85, 48]} />
      <meshBasicMaterial
        color="#ccffff"
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ── Beach Auto Rotate Controller ─────────────────────────────────
function BeachAutoRotate({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!enabled) return;
    timeRef.current += delta;

    const t = timeRef.current * 0.04;
    const orbitRadius = 55 + Math.sin(t * 0.3) * 12;
    const camX = Math.sin(t) * orbitRadius;
    const camZ = Math.cos(t) * orbitRadius * 0.65 + 15;
    const camY = 18 + Math.sin(t * 0.35) * 6;

    const lookX = Math.sin(t * 0.25) * 8;
    const lookZ = 8 + Math.cos(t * 0.2) * 4;
    const lookY = 1;

    camera.position.x += (camX - camera.position.x) * 0.012;
    camera.position.y += (camY - camera.position.y) * 0.012;
    camera.position.z += (camZ - camera.position.z) * 0.012;
    camera.lookAt(lookX, lookY, lookZ);
  });

  return null;
}

// ── Post Processing — Bloom ──────────────────────────────────────
function BeachPostProcessing({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.9}
        luminanceSmoothing={0.4}
        intensity={0.4}
        mipmapBlur
      />
    </EffectComposer>
  );
}

// ── Main BeachScene ──────────────────────────────────────────────
export function BeachScene({ autoRotate = false, effects = { bloom: false, vignette: true } }: {
  autoRotate?: boolean;
  effects?: { bloom: boolean; vignette: boolean };
}) {
  const [splashOrigin, setSplashOrigin] = useState(new THREE.Vector3(0, 0, 0));
  const [splashActive, setSplashActive] = useState(false);
  const [rippleOrigins, setRippleOrigins] = useState<{ origin: THREE.Vector3; time: number }[]>([]);

  const handleOceanClick = useCallback((point: THREE.Vector3) => {
    setSplashOrigin(point.clone());
    setSplashActive(true);
    setTimeout(() => setSplashActive(false), 1500);

    setRippleOrigins(prev => [...prev.slice(-4), { origin: point.clone(), time: performance.now() / 1000 }]);
  }, []);

  return (
    <>
      {/* Environment */}
      <BeachSky />
      <SunLight />
      <fog attach="fog" args={['#b8d4e8', 80, 400]} />

      {/* Lighting */}
      <ambientLight intensity={0.35} color="#b8d4e8" />
      <hemisphereLight intensity={0.5} color="#87ceeb" groundColor="#d4c4a0" />
      <pointLight position={[50, 30, 20]} intensity={0.8} color="#ffe4c4" distance={150} />

      {/* Ocean */}
      <Ocean onPointerDown={handleOceanClick} />

      {/* Terrain */}
      <BeachTerrain />
      <Rocks />

      {/* Vegetation */}
      <PalmTrees />

      {/* Living entities */}
      <Seagulls />
      <FishGroup />

      {/* Particles */}
      <FoamParticles />
      <SplashParticles origin={splashOrigin} active={splashActive} />

      {/* Ripple effects */}
      {rippleOrigins.map((ripple, i) => (
        <RippleMesh key={i} origin={ripple.origin} startTime={ripple.time} />
      ))}

      {/* Auto rotate */}
      <BeachAutoRotate enabled={autoRotate} />

      {/* Post processing */}
      <BeachPostProcessing enabled={effects.bloom} />

      {/* Camera controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.4}
        zoomSpeed={1.0}
        minDistance={15}
        maxDistance={120}
        maxPolarAngle={Math.PI * 0.48}
        minPolarAngle={0.08}
        target={[0, 0, 0]}
      />
    </>
  );
}
