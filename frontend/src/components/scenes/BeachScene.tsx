import { useRef, useMemo, useCallback, useState } from 'react';
import { useFrame, useThree, extend, type Object3DNode } from '@react-three/fiber';
import { OrbitControls, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ── Noise Functions (Simplex-style) ──────────────────────────────
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

// ── Ocean Shader Material ────────────────────────────────────────
const OceanMaterial = shaderMaterial(
  {
    uTime: 0,
    uSunDir: new THREE.Vector3(0.5, 0.8, 0.3).normalize(),
    uSunColor: new THREE.Color('#ffe8cc'),
    uDeepColor: new THREE.Color('#003366'),
    uShallowColor: new THREE.Color('#0099cc'),
    uFoamColor: new THREE.Color('#ffffff'),
    uFresnelPower: 3.0,
    uWaveSpeed: 0.8,
    uWaveHeight: 1.2,
    uRippleOrigin: new THREE.Vector3(0, 0, 0),
    uRippleTime: -1,
  },
  // Vertex Shader
  `uniform float uTime;
   uniform float uWaveSpeed;
   uniform float uWaveHeight;
   uniform vec3 uRippleOrigin;
   uniform float uRippleTime;

   varying vec3 vWorldPos;
   varying vec3 vNormal;
   varying float vHeight;
   varying float vFoam;

   // Gerstner wave function
   vec3 gerstnerWave(vec3 pos, float steepness, float wavelength, vec2 direction) {
     float k = 2.0 * 3.14159 / wavelength;
     float c = sqrt(9.8 / k);
     vec2 d = normalize(direction);
     float f = k * (dot(d, pos.xz) - c * uTime * uWaveSpeed);
     float a = steepness / k;

     return vec3(
       d.x * (a * cos(f)),
       a * sin(f),
       d.y * (a * cos(f))
     );
   }

   void main() {
     vec3 pos = position;

     // Multiple Gerstner waves for realistic ocean
     vec3 wave1 = gerstnerWave(pos, 0.25, 60.0, vec2(1.0, 0.0));
     vec3 wave2 = gerstnerWave(pos, 0.15, 30.0, vec2(0.7, 0.7));
     vec3 wave3 = gerstnerWave(pos, 0.1, 15.0, vec2(-0.3, 0.8));
     vec3 wave4 = gerstnerWave(pos, 0.05, 8.0, vec2(0.5, -0.5));

     pos += wave1 + wave2 + wave3 + wave4;

     // Ripple effect from click
     if (uRippleTime > 0.0) {
       float dist = distance(pos.xz, uRippleOrigin.xz);
       float rippleAge = uTime - uRippleTime;
       float rippleRadius = rippleAge * 15.0;
       float rippleWidth = 3.0;
       float ripple = smoothstep(rippleRadius - rippleWidth, rippleRadius, dist) *
                      smoothstep(rippleRadius + rippleWidth, rippleRadius, dist);
       pos.y += ripple * 2.0 * exp(-rippleAge * 0.5);
     }

     vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
     vHeight = pos.y;

     // Calculate normal from wave derivatives
     vec3 tangent = vec3(1.0, 0.0, 0.0);
     vec3 bitangent = vec3(0.0, 0.0, 1.0);
     vNormal = normalize(cross(bitangent, tangent));

     // Foam based on wave height
     vFoam = smoothstep(0.8, 1.5, pos.y);

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
   varying float vFoam;

   void main() {
     vec3 viewDir = normalize(cameraPosition - vWorldPos);
     vec3 normal = normalize(vNormal);

     // Fresnel effect
     float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);

     // Subsurface scattering approximation
     float sss = pow(max(dot(viewDir, -uSunDir), 0.0), 4.0) * 0.3;

     // Water color based on depth/height
     vec3 waterColor = mix(uDeepColor, uShallowColor, smoothstep(-2.0, 2.0, vHeight));

     // Sun specular highlight (Blinn-Phong)
     vec3 halfDir = normalize(uSunDir + viewDir);
     float spec = pow(max(dot(normal, halfDir), 0.0), 256.0);
     vec3 specular = uSunColor * spec * 1.5;

     // Combine
     vec3 color = waterColor;
     color = mix(color, uShallowColor * 1.2, fresnel * 0.5);
     color += sss * uShallowColor * 0.5;
     color += specular;

     // Foam at wave peaks
     color = mix(color, uFoamColor, vFoam * 0.6);

     // Slight transparency at edges
     float alpha = 0.85 + fresnel * 0.15;

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
  uWaveHeight: number;
  uRippleOrigin: THREE.Vector3;
  uRippleTime: number;
};

declare module '@react-three/fiber' {
  interface ThreeElements {
    oceanMaterial: Object3DNode<OceanMaterialType, typeof OceanMaterial>;
  }
}

// ── Sky Dome Shader ──────────────────────────────────────────────
const SkyMaterial = shaderMaterial(
  { uTime: 0, uSunPos: new THREE.Vector3(100, 80, 50) },
  `varying vec3 vWorldPos;
   void main() {
     vec4 wp = modelMatrix * vec4(position, 1.0);
     vWorldPos = wp.xyz;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  `uniform float uTime;
   uniform vec3 uSunPos;
   varying vec3 vWorldPos;

   float hash(vec2 p) {
     return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
   }

   float noise(vec2 p) {
     vec2 i = floor(p), f = fract(p);
     f = f * f * (3.0 - 2.0 * f);
     float a = hash(i), b = hash(i + vec2(1.0, 0.0));
     float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
     return a + (b - a) * f.x + (c - a) * f.y + (a - b - c + d) * f.x * f.y;
   }

   float fbm(vec2 p) {
     float v = 0.0, a = 0.5;
     for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
     return v;
   }

   void main() {
     vec3 dir = normalize(vWorldPos);
     float h = dir.y;

     // Sky gradient: deep blue → light blue → horizon white
     vec3 topColor = vec3(0.1, 0.3, 0.7);
     vec3 midColor = vec3(0.3, 0.6, 0.9);
     vec3 horizonColor = vec3(0.9, 0.95, 1.0);

     vec3 skyColor;
     if (h > 0.3) {
       skyColor = mix(midColor, topColor, smoothstep(0.3, 0.8, h));
     } else if (h > 0.0) {
       skyColor = mix(horizonColor, midColor, smoothstep(0.0, 0.3, h));
     } else {
       skyColor = horizonColor;
     }

     // Sun glow
     vec3 sunDir = normalize(uSunPos);
     float sunAngle = max(dot(dir, sunDir), 0.0);
     float sunGlow = pow(sunAngle, 32.0) * 2.0;
     float sunHalo = pow(sunAngle, 4.0) * 0.3;

     vec3 sunColor = vec3(1.0, 0.95, 0.8);
     skyColor += sunColor * (sunGlow + sunHalo);

     // Clouds (simple noise-based)
     float cloudNoise = fbm(dir.xz * 3.0 + uTime * 0.02);
     float clouds = smoothstep(0.4, 0.6, cloudNoise) * 0.3;
     skyColor = mix(skyColor, vec3(1.0), clouds * smoothstep(0.0, 0.5, h));

     gl_FragColor = vec4(skyColor, 1.0);
   }`
);

extend({ SkyMaterial });

type SkyMaterialType = THREE.ShaderMaterial & {
  uTime: number;
  uSunPos: THREE.Vector3;
};

declare module '@react-three/fiber' {
  interface ThreeElements {
    skyMaterial: Object3DNode<SkyMaterialType, typeof SkyMaterial>;
  }
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

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      onPointerDown={handleClick}
    >
      <planeGeometry args={[600, 600, 256, 256]} />
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

// ── Sky Dome ─────────────────────────────────────────────────────
function SkyDome() {
  const matRef = useRef<SkyMaterialType>(null);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uTime = clock.getElapsedTime();
    }
  });

  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[500, 64, 32]} />
      {/* @ts-ignore */}
      <skyMaterial
        ref={matRef}
        attach="material"
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Sun ──────────────────────────────────────────────────────────
function Sun() {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      const t = clock.getElapsedTime();
      const scale = 8 + Math.sin(t * 0.5) * 0.5;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={[100, 80, 50]}>
      {/* Sun sphere */}
      <mesh>
        <sphereGeometry args={[5, 32, 32]} />
        <meshBasicMaterial color="#fff5e0" />
      </mesh>

      {/* Sun glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffe8cc"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Directional light from sun */}
      <directionalLight
        position={[0, 0, 0]}
        intensity={1.8}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </group>
  );
}

// ── Beach Terrain ────────────────────────────────────────────────
function BeachTerrain() {
  const { geometry: sandGeo } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(400, 400, 128, 128);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i); // Y in plane becomes Z in world

      // Create gentle slope toward water
      let height = 0;

      // Dry sand (higher, further from water)
      if (z < -20) {
        height = (-z - 20) * 0.05 + fbm2D(x * 0.05, z * 0.05) * 0.5;
      }
      // Wet sand (lower, near water)
      else if (z < 10) {
        height = -(z + 20) * 0.02 + fbm2D(x * 0.1, z * 0.1) * 0.2;
      }
      // Underwater
      else {
        height = -0.5 - z * 0.02;
      }

      pos.setZ(i, height);
    }

    geo.computeVertexNormals();
    return { geometry: geo };
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 30]} receiveShadow>
      <primitive object={sandGeo} attach="geometry" />
      <meshStandardMaterial
        color="#f4d998"
        roughness={0.9}
        metalness={0.0}
      />
    </mesh>
  );
}

// ── Wet Sand ─────────────────────────────────────────────────────
function WetSand() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 10]} receiveShadow>
      <planeGeometry args={[400, 60, 64, 16]} />
      <meshStandardMaterial
        color="#d4b86a"
        roughness={0.6}
        metalness={0.1}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// ── Rock ─────────────────────────────────────────────────────────
function Rock({ position, scale }: { position: [number, number, number]; scale: number }) {
  const geo = useMemo(() => {
    const g = new THREE.DodecahedronGeometry(1, 1);
    const pos = g.attributes.position;

    // Random vertex displacement for organic look
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const noise = fbm2D(x * 2, z * 2) * 0.3;
      pos.setX(i, x + noise);
      pos.setY(i, y + noise * 0.5);
      pos.setZ(i, z + noise);
    }

    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh position={position} scale={scale} castShadow>
      <primitive object={geo} attach="geometry" />
      <meshStandardMaterial
        color="#666666"
        roughness={0.95}
        metalness={0.05}
        flatShading
      />
    </mesh>
  );
}

// ── Rocks Group ──────────────────────────────────────────────────
function Rocks() {
  const rocks = useMemo(() => {
    const result: { pos: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 30 + Math.random() * 40;
      result.push({
        pos: [
          Math.cos(angle) * dist,
          0.5 + Math.random() * 0.5,
          Math.sin(angle) * dist,
        ],
        scale: 1 + Math.random() * 2,
      });
    }
    return result;
  }, []);

  return (
    <>
      {rocks.map((rock, i) => (
        <Rock key={i} position={rock.pos} scale={rock.scale} />
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
      // Gentle swaying
      trunkRef.current.rotation.z = Math.sin(t * 0.5 + position[0]) * 0.02;
      trunkRef.current.rotation.x = Math.sin(t * 0.3 + position[2]) * 0.01;
      leavesRef.current.rotation.z = Math.sin(t * 0.7 + position[0]) * 0.05;
      leavesRef.current.rotation.x = Math.sin(t * 0.4 + position[2]) * 0.03;
    }
  });

  // Generate trunk segments using bezier curve
  const trunkSegments = useMemo(() => {
    const segments: { pos: THREE.Vector3; rot: number }[] = [];
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.5, 3, 0),
      new THREE.Vector3(-0.3, 7, 0),
      new THREE.Vector3(0.2, 10, 0)
    );

    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const point = curve.getPoint(t);
      segments.push({
        pos: point,
        rot: Math.atan2(point.x, point.y) * 0.1,
      });
    }
    return segments;
  }, []);

  // Generate palm leaves
  const leaves = useMemo(() => {
    const result: { rot: number; tilt: number }[] = [];
    for (let i = 0; i < 8; i++) {
      result.push({
        rot: (i / 8) * Math.PI * 2,
        tilt: 0.3 + Math.random() * 0.4,
      });
    }
    return result;
  }, []);

  return (
    <group position={position}>
      {/* Trunk */}
      <group ref={trunkRef}>
        {trunkSegments.map((seg, i) => (
          <mesh key={i} position={seg.pos} rotation={[0, 0, seg.rot]}>
            <cylinderGeometry args={[0.15 - i * 0.01, 0.2 - i * 0.01, 1.2, 8]} />
            <meshStandardMaterial color="#8B7355" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Leaves */}
      <group ref={leavesRef} position={[0.2, 10, 0]}>
        {leaves.map((leaf, i) => (
          <group key={i} rotation={[0, leaf.rot, 0]}>
            <mesh rotation={[leaf.tilt, 0, 0]} position={[0, 0.5, 0]}>
              <planeGeometry args={[0.3, 4]} />
              <meshStandardMaterial
                color="#228B22"
                roughness={0.8}
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
              Math.cos(i * 2.1) * 0.5,
              -0.3,
              Math.sin(i * 2.1) * 0.5,
            ]}
          >
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color="#8B4513" roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ── Palm Trees Group ─────────────────────────────────────────────
function PalmTrees() {
  const positions = useMemo<[number, number, number][]>(() => [
    [-40, 0, -60],
    [-30, 0, -70],
    [-50, 0, -55],
    [40, 0, -65],
    [55, 0, -50],
    [30, 0, -75],
    [-20, 0, -80],
    [20, 0, -85],
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
    const speed = 0.3;
    const radius = 30;
    const x = Math.sin(t * speed) * radius;
    const z = Math.sin(t * speed * 2) * radius * 0.5;
    const y = 25 + Math.sin(t * 0.5) * 5;

    ref.current.position.set(x, y, z);

    // Face direction of movement
    const dx = Math.cos(t * speed) * radius * speed;
    const dz = Math.cos(t * speed * 2) * radius * speed;
    ref.current.rotation.y = Math.atan2(dx, dz);

    // Wing flapping
    wingRef.current.rotation.x = Math.sin(t * 3) * 0.5;
  });

  return (
    <group ref={ref}>
      {/* Body */}
      <mesh>
        <coneGeometry args={[0.3, 1.2, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
      </mesh>

      {/* Wings */}
      <group ref={wingRef}>
        {/* Left wing */}
        <mesh position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
          <planeGeometry args={[1.5, 0.4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>

        {/* Right wing */}
        <mesh position={[0.8, 0, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <planeGeometry args={[1.5, 0.4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Head */}
      <mesh position={[0, 0.1, 0.5]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ── Seagulls Group ───────────────────────────────────────────────
function Seagulls() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <Seagull key={i} offset={i * 1.5} />
      ))}
    </>
  );
}

// ── Jumping Fish ─────────────────────────────────────────────────
function JumpingFish() {
  const ref = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const nextJumpRef = useRef(0);
  const jumpPhaseRef = useRef(0);
  const startPosRef = useRef(new THREE.Vector3());

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    timeRef.current += delta;

    // Random jump timing (Poisson-like)
    if (timeRef.current > nextJumpRef.current) {
      nextJumpRef.current = timeRef.current + 2 + Math.random() * 5;
      jumpPhaseRef.current = 0;
      startPosRef.current.set(
        (Math.random() - 0.5) * 100,
        -0.5,
        (Math.random() - 0.5) * 50 + 10,
      );
    }

    // Parabolic jump trajectory
    if (jumpPhaseRef.current < 1) {
      jumpPhaseRef.current += delta * 0.8;
      const t = jumpPhaseRef.current;
      const height = 8 * (1 - (2 * t - 1) * (2 * t - 1)); // Parabola

      ref.current.position.set(
        startPosRef.current.x + t * 10,
        startPosRef.current.y + height,
        startPosRef.current.z,
      );

      // Rotate fish along trajectory
      ref.current.rotation.z = Math.atan2(
        8 * (-4 * t + 2), // dy/dt
        10, // dx/dt
      );

      ref.current.visible = true;
    } else {
      ref.current.visible = false;
    }
  });

  return (
    <group ref={ref} visible={false}>
      {/* Fish body */}
      <mesh>
        <sphereGeometry args={[0.5, 8, 6]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Tail */}
      <mesh position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.3, 0.8, 4]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  );
}

// ── Fish Group ───────────────────────────────────────────────────
function FishGroup() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <JumpingFish key={i} />
      ))}
    </>
  );
}

// ── Foam Particles ───────────────────────────────────────────────
function FoamParticles() {
  const ref = useRef<THREE.Points>(null);

  const { geometry } = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100 + 10;
      sizes[i] = 0.3 + Math.random() * 0.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return { geometry: geo };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Move foam with waves
      pos.setY(i, Math.sin(t * 0.5 + x * 0.1 + z * 0.1) * 0.3 + 0.2);
    }

    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color="#ffffff"
        size={0.4}
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ── Splash Particles (from click) ────────────────────────────────
function SplashParticles({ origin, active }: { origin: THREE.Vector3; active: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { geometry, velocities } = useMemo(() => {
    const count = 50;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Random initial velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      velocities[i * 3] = Math.cos(angle) * speed;
      velocities[i * 3 + 1] = 5 + Math.random() * 8;
      velocities[i * 3 + 2] = Math.sin(angle) * speed;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    return { geometry: geo, velocities };
  }, []);

  useFrame((_, delta) => {
    if (!ref.current || !active) return;

    timeRef.current += delta;
    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // Apply velocity with gravity
      pos.setX(i, x + velocities[i * 3] * delta);
      pos.setY(i, y + velocities[i * 3 + 1] * delta);
      pos.setZ(i, z + velocities[i * 3 + 2] * delta);

      // Gravity
      velocities[i * 3 + 1] -= 9.8 * delta;

      // Reset if below water
      if (pos.getY(i) < -1) {
        pos.setXYZ(i, 0, 0, 0);
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        velocities[i * 3] = Math.cos(angle) * speed;
        velocities[i * 3 + 1] = 5 + Math.random() * 8;
        velocities[i * 3 + 2] = Math.sin(angle) * speed;
      }
    }

    pos.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={ref} position={origin}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial
        color="#ffffff"
        size={0.3}
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ── Ripple Effect Mesh ───────────────────────────────────────────
function RippleMesh({ origin, startTime }: { origin: THREE.Vector3; startTime: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const age = clock.getElapsedTime() - startTime;

    // Expand and fade
    const scale = age * 15;
    const opacity = Math.max(0, 1 - age * 0.5);

    ref.current.scale.setScalar(scale);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = opacity;

    // Remove after faded
    if (opacity <= 0) {
      ref.current.visible = false;
    }
  });

  return (
    <mesh ref={ref} position={origin} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1, 64]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.5}
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

    const t = timeRef.current * 0.05;

    // Gentle orbit around the beach scene
    const orbitRadius = 60 + Math.sin(t * 0.3) * 15;
    const camX = Math.sin(t) * orbitRadius;
    const camZ = Math.cos(t) * orbitRadius * 0.6 + 20;
    const camY = 20 + Math.sin(t * 0.4) * 8;

    // Look at the ocean area
    const lookX = Math.sin(t * 0.3) * 10;
    const lookZ = 10 + Math.cos(t * 0.2) * 5;
    const lookY = 2;

    camera.position.x += (camX - camera.position.x) * 0.015;
    camera.position.y += (camY - camera.position.y) * 0.015;
    camera.position.z += (camZ - camera.position.z) * 0.015;
    camera.lookAt(lookX, lookY, lookZ);
  });

  return null;
}

// ── Main BeachScene ──────────────────────────────────────────────
export function BeachScene({ autoRotate = false }: { autoRotate?: boolean }) {
  const [splashOrigin, setSplashOrigin] = useState(new THREE.Vector3(0, 0, 0));
  const [splashActive, setSplashActive] = useState(false);
  const [rippleOrigins, setRippleOrigins] = useState<{ origin: THREE.Vector3; time: number }[]>([]);

  const handleOceanClick = useCallback((point: THREE.Vector3) => {
    // Trigger splash
    setSplashOrigin(point.clone());
    setSplashActive(true);
    setTimeout(() => setSplashActive(false), 2000);

    // Add ripple
    setRippleOrigins(prev => [...prev, { origin: point.clone(), time: performance.now() / 1000 }]);
  }, []);

  return (
    <>
      {/* Environment */}
      <SkyDome />
      <Sun />
      <fog attach="fog" args={['#87ceeb', 100, 500]} />

      {/* Lighting */}
      <ambientLight intensity={0.4} color="#87ceeb" />
      <hemisphereLight intensity={0.6} color="#87ceeb" groundColor="#f4d998" />

      {/* Ocean */}
      <Ocean onPointerDown={handleOceanClick} />

      {/* Terrain */}
      <BeachTerrain />
      <WetSand />
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

      {/* Camera controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.4}
        zoomSpeed={1.0}
        minDistance={20}
        maxDistance={120}
        maxPolarAngle={Math.PI * 0.45}
        minPolarAngle={0.1}
        target={[0, 0, 0]}
      />
    </>
  );
}
