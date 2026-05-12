import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { useFrame, useThree, extend, type Object3DNode } from '@react-three/fiber';
import { OrbitControls, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
// GLSL snippets
// ═══════════════════════════════════════════════════════════════
const glslSnoise3 = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`;

// ═══════════════════════════════════════════════════════════════
// Ocean shader (Simplex noise waves)
// ═══════════════════════════════════════════════════════════════
const OceanMaterial = shaderMaterial(
  {
    uTime: 0,
    uDeepColor: new THREE.Color('#003d5c'),
    uShallowColor: new THREE.Color('#0077b6'),
    uFoamColor: new THREE.Color('#e0f4ff'),
    uSunDir: new THREE.Vector3(0.5, 0.7, -0.5).normalize(),
    uSunColor: new THREE.Color('#fff8dc'),
    uCameraPos: new THREE.Vector3(),
  },
  `uniform float uTime;
   varying vec2 vUv;
   varying vec3 vWorldPos;
   varying vec3 vNormal;
   varying float vElevation;

   ${glslSnoise3}

   void main() {
     vUv = uv;
     vec3 pos = position;
     float t = uTime * 0.5;

     float wave1  = sin(pos.x * 0.04 + t * 0.8) * cos(pos.y * 0.025 + t * 0.6) * 2.0;
     float wave2  = sin(pos.x * 0.08 + t * 1.2 + 1.0) * cos(pos.y * 0.06 + t * 0.9) * 1.0;
     float noise1 = snoise(vec3(pos.x * 0.015, pos.y * 0.015, t * 0.25)) * 3.0;
     float noise2 = snoise(vec3(pos.x * 0.04, pos.y * 0.04, t * 0.4)) * 0.8;
     float noise3 = snoise(vec3(pos.x * 0.1, pos.y * 0.08, t * 0.7)) * 0.3;
     float elevation = wave1 + wave2 + noise1 + noise2 + noise3;

     pos.z += elevation;
     vElevation = elevation;

     float eps = 0.5;
     float hx = (snoise(vec3((pos.x+eps)*0.04, pos.y*0.04, t*0.4)) -
                 snoise(vec3((pos.x-eps)*0.04, pos.y*0.04, t*0.4))) * 0.8;
     float hy = (snoise(vec3(pos.x*0.04, (pos.y+eps)*0.04, t*0.4)) -
                 snoise(vec3(pos.x*0.04, (pos.y-eps)*0.04, t*0.4))) * 0.8;
     vNormal = normalize(vec3(-hx, -hy, 1.0));

     vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
   }`,
  `uniform float uTime;
   uniform vec3 uDeepColor;
   uniform vec3 uShallowColor;
   uniform vec3 uFoamColor;
   uniform vec3 uSunDir;
   uniform vec3 uSunColor;
   uniform vec3 uCameraPos;
   varying vec2 vUv;
   varying vec3 vWorldPos;
   varying vec3 vNormal;
   varying float vElevation;

   void main() {
     vec3 normal = normalize(vNormal);
     vec3 viewDir = normalize(uCameraPos - vWorldPos);
     float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 4.0);

     vec3 halfVec = normalize(uSunDir + viewDir);
     float spec  = pow(max(dot(normal, halfVec), 0.0), 512.0);
     float spec2 = pow(max(dot(normal, halfVec), 0.0), 128.0) * 0.3;

     float depth = smoothstep(-4.0, 4.0, vElevation);
     vec3 baseColor = mix(uDeepColor, uShallowColor, depth);

     float foamMask  = smoothstep(2.2, 3.5, vElevation);
     foamMask += smoothstep(1.8, 2.8, vElevation) * 0.3 * (0.5 + 0.5*sin(vWorldPos.x*2.0 + uTime));

     float sss = pow(max(dot(viewDir, -uSunDir), 0.0), 3.0) * 0.15;
     vec3 sssColor = vec3(0.1, 0.5, 0.6) * sss;

     vec3 col = baseColor;
     col += uSunColor * (spec + spec2) * 1.5;
     col  = mix(col, vec3(0.7, 0.9, 1.0), fresnel * 0.35);
     col  = mix(col, uFoamColor, foamMask * 0.7);
     col += sssColor;
     col += vec3(0.4, 0.7, 0.9) * fresnel * 0.15;

     gl_FragColor = vec4(col, 0.94);
   }`,
);

extend({ OceanMaterial });
type OceanMat = THREE.ShaderMaterial & { [k: string]: any };
declare module '@react-three/fiber' {
  interface ThreeElements { oceanMaterial: Object3DNode<OceanMat, typeof OceanMaterial> }
}

// ═══════════════════════════════════════════════════════════════
// Beach sand shader (depth-based dry → wet gradient)
// ═══════════════════════════════════════════════════════════════
const BeachShaderMat = shaderMaterial(
  {
    uDrySand: new THREE.Color('#f2e2b6'),
    uWetSand: new THREE.Color('#d4b86a'),
    uDarkSand: new THREE.Color('#c4a050'),
    uFoamLine: new THREE.Color('#ffffff'),
  },
  `varying vec2 vUv; varying vec3 vPosition;
   void main() { vUv=uv; vPosition=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  `uniform vec3 uDrySand,uWetSand,uDarkSand,uFoamLine;
   varying vec2 vUv; varying vec3 vPosition;
   float random(vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}
   void main(){
     float d = smoothstep(-20.0,35.0,vPosition.y);
     float n = random(vUv*150.0)*0.08;
     vec3 c;
     if(d<0.4) c=mix(uDarkSand,uWetSand,d/0.4);
     else if(d<0.7) c=mix(uWetSand,uDrySand,(d-0.4)/0.3);
     else c=uDrySand;
     c+=n;
     float ed=min(min(abs(vPosition.x-95.0),abs(vPosition.x+90.0)),abs(vPosition.y+20.0));
     c=mix(c,uFoamLine,smoothstep(8.0,2.0,ed)*0.3);
     gl_FragColor=vec4(c,1.0);
   }`,
);
extend({ BeachShaderMat });
type BeachMat = THREE.ShaderMaterial & { [k: string]: any };
declare module '@react-three/fiber' {
  interface ThreeElements { beachShaderMat: Object3DNode<BeachMat, typeof BeachShaderMat> }
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

// ═══════════════════════════════════════════════════════════════
// Sky background — Canvas gradient texture on scene.background
// Avoids WebGL2 BackSide ShaderMaterial bug entirely
// ═══════════════════════════════════════════════════════════════
function SkyBackground() {
  const { scene } = useThree();
  const { gl } = useThree();

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    // Equirectangular: 0=南极 0.5=赤道(地平线) 1=北极(天顶)
    gradient.addColorStop(0, '#87CEEB');   // 南极(不可见/地平线色)
    gradient.addColorStop(0.5, '#87CEEB'); // 赤道=地平线(最亮)
    gradient.addColorStop(0.7, '#1E90FF'); // 中天
    gradient.addColorStop(0.85, '#0066DD');// 天顶附近(深蓝)
    gradient.addColorStop(1, '#0044AA');   // 天顶(最深蓝)
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = tex;
    // Also set renderer clear color as fallback
    gl.setClearColor(new THREE.Color('#1E90FF'));

    return () => {
      scene.background = null;
      tex.dispose();
    };
  }, [scene, gl]);

  return null;
}

function SkyDome() {
  // Sun glow sphere — warm tone atmosphere near sun position
  const glowTex = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0, 'rgba(255,240,180,0.6)');
    g.addColorStop(0.1, 'rgba(255,220,120,0.3)');
    g.addColorStop(0.4, 'rgba(255,180,60,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <sprite position={[300, 120, -400]} scale={[350, 350, 1]}>
      <spriteMaterial map={glowTex} blending={THREE.AdditiveBlending}
        depthWrite={false} depthTest={false} opacity={0.95} />
    </sprite>
  );
}

// ═══════════════════════════════════════════════════════════════
// Sun + halo + directional light
// ═══════════════════════════════════════════════════════════════
function SunAndLight() {
  const sunPos = useMemo(() => new THREE.Vector3(350, 180, -450), []);
  const glowTex = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,238,136,1)');
    g.addColorStop(0.05, 'rgba(255,238,136,0.9)');
    g.addColorStop(0.2, 'rgba(255,200,80,0.5)');
    g.addColorStop(0.5, 'rgba(255,140,30,0.1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <group>
      <directionalLight position={[100, 200, 50]} intensity={2.0} color="#FFFAF0" />
      {/* Sun body */}
      <mesh position={sunPos}>
        <sphereGeometry args={[20, 32, 32]} />
        <meshBasicMaterial color="#ffee88" />
      </mesh>
      {/* Sun glow — sprite instead of sphere to avoid black ball artifact */}
      <sprite position={sunPos} scale={[120, 120, 1]}>
        <spriteMaterial map={glowTex} blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.85} />
      </sprite>
      <sprite position={sunPos} scale={[200, 200, 1]}>
        <spriteMaterial map={glowTex} blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.35} />
      </sprite>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// Ocean (Simplex noise waves)
// ═══════════════════════════════════════════════════════════════
function Ocean({ onClick }: { onClick: (p: THREE.Vector3) => void }) {
  const matRef = useRef<OceanMat>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(600, 600, 300, 300), []);

  useFrame(({ clock, camera }) => {
    if (!matRef.current) return;
    matRef.current.uTime = clock.getElapsedTime();
    matRef.current.uCameraPos.copy(camera.position);
  });

  return (
    <mesh geometry={geo} rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]}
      onClick={(e) => { if (e.point) onClick(e.point.clone()); }}>
      {/* @ts-ignore */}
      <oceanMaterial ref={matRef} attach="material" transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════════
// Beach — organic ShapeGeometry + sand dunes + debris
// ═══════════════════════════════════════════════════════════════
function Beach() {
  const { geo: beachGeo, dunes } = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-90, -20);
    shape.quadraticCurveTo(-70, 25, -40, 30);
    shape.quadraticCurveTo(0, 35, 40, 30);
    shape.quadraticCurveTo(75, 22, 95, -15);
    shape.quadraticCurveTo(85, -5, 60, 5);
    shape.quadraticCurveTo(30, 12, 0, 10);
    shape.quadraticCurveTo(-30, 12, -60, 5);
    shape.quadraticCurveTo(-85, -5, -90, -20);
    const g = new THREE.ShapeGeometry(shape, 64, 64);

    const dArray: { pos: [number, number, number]; scale: [number, number, number]; rot: number }[] = [];
    const rand = rng(42);
    for (let i = 0; i < 12; i++) {
      dArray.push({
        pos: [(rand() - 0.5) * 120, -0.3, 40 + rand() * 30],
        scale: [1.5 + rand(), 0.3 + rand() * 0.3, 1.5 + rand()],
        rot: rand() * Math.PI,
      });
    }
    return { geo: g, dunes: dArray };
  }, []);

  const debrisPts = useMemo(() => {
    const count = 80;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const rand = rng(77);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (rand() - 0.5) * 140;
      pos[i*3+1] = -0.28;
      pos[i*3+2] = 20 + rand() * 50;
      const c = rand();
      if (c < 0.4)      { col[i*3]=0.95; col[i*3+1]=0.93; col[i*3+2]=0.88; }
      else if (c < 0.7) { col[i*3]=0.60; col[i*3+1]=0.58; col[i*3+2]=0.55; }
      else              { col[i*3]=0.85; col[i*3+1]=0.75; col[i*3+2]=0.60; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, []);

  return (
    <group>
      {/* Main beach shape */}
      <mesh geometry={beachGeo} rotation={[-Math.PI/2, 0, 0]} position={[0, -0.3, 35]}>
        {/* @ts-ignore */}
        <beachShaderMat attach="material" side={THREE.DoubleSide} />
      </mesh>
      {/* Sand dunes */}
      {dunes.map((d, i) => (
        <mesh key={`dune-${i}`} position={d.pos} scale={d.scale} rotation-y={d.rot}>
          <sphereGeometry args={[3 + d.scale[0] * 2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={new THREE.Color().setHSL(0.1, 0.5, 0.75 + d.scale[1] * 0.1)} roughness={0.95} metalness={0} />
        </mesh>
      ))}
      {/* Debris particles */}
      <points geometry={debrisPts} position={[0, 0, 0]}>
        <pointsMaterial size={0.18} vertexColors roughness={0.9} />
      </points>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// Rocks — low-poly dodecahedrons with vertex noise
// ═══════════════════════════════════════════════════════════════
function buildRockGeo(scale: number) {
  const g = new THREE.DodecahedronGeometry(scale, 2);
  const p = g.attributes.position;
  const rand = rng(Math.floor(scale * 100));
  for (let i = 0; i < p.count; i++) {
    const n = (rand() - 0.5) * scale * 0.35;
    p.setXYZ(i, p.getX(i) + n, p.getY(i) + n * 0.6, p.getZ(i) + n);
  }
  g.computeVertexNormals();
  return g;
}

function Rocks() {
  const configs: { x: number; z: number; s: number; ry: number }[] = [
    { x: -28, z: 10, s: 3.5, ry: 0.3 }, { x: -22, z: 6, s: 2.2, ry: 1.2 },
    { x: 24, z: 12, s: 3.0, ry: -0.5 }, { x: 30, z: 17, s: 2.0, ry: 2.1 },
    { x: -12, z: 19, s: 2.5, ry: 0.8 }, { x: 8, z: 22, s: 1.8, ry: -1.5 },
    { x: -35, z: 14, s: 2.3, ry: 3.0 },
  ];
  const geos = useMemo(() => configs.map(c => buildRockGeo(c.s)), [configs]);

  return (
    <group>
      {configs.map((c, i) => (
        <mesh key={`rock-${i}`} geometry={geos[i]}
          position={[c.x, c.s * 0.1, c.z]}
          rotation={[(Math.random()-0.5)*0.25, c.ry, (Math.random()-0.5)*0.25]}
         >
          <meshStandardMaterial color="#3d3d3d" roughness={0.96} metalness={0.02} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// Palm tree — CatmullRomCurve3 trunk + detailed leaflets
// ═══════════════════════════════════════════════════════════════
function buildPalmLeaflets() {
  const group = new THREE.Group();
  const length = 5 + Math.random() * 2;
  const leafletCount = 18;

  // Rachis (midrib)
  const rachis = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.06, length, 6),
    new THREE.MeshStandardMaterial({ color: '#3d6b3d', roughness: 0.8 })
  );
  rachis.rotation.x = Math.PI / 2;
  rachis.position.z = length / 2 - 0.5;
  group.add(rachis);

  for (let i = 0; i < leafletCount; i++) {
    const t = i / (leafletCount - 1);
    const z = t * (length - 1);
    [-1, 1].forEach(side => {
      const len = (1 - t * 0.6) * 1.8;
      const w = 0.15 + (1 - t) * 0.15;
      const g = new THREE.PlaneGeometry(w, len);
      const hue = 0.28 + Math.random() * 0.05;
      const light = 0.25 + t * 0.15;
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, 0.65, light),
        side: THREE.DoubleSide, roughness: 0.7, metalness: 0.05,
      });
      const leaflet = new THREE.Mesh(g, mat);
      leaflet.position.set(side * 0.1, 0, z);
      leaflet.rotation.y = side * (0.4 + t * 0.8);
      leaflet.rotation.x = -t * 0.8 * 0.3;
      leaflet.rotation.z = side * 0.1 * Math.sin(t * Math.PI);
      group.add(leaflet);
    });
  }
  return group;
}

function PalmTree({ idx, position }: { idx: number; position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const leafRefs = useRef<THREE.Mesh[]>([]);

  const trunkHeight = 10 + (idx % 5) * 0.8;

  // Trunk tube geometry
  const trunkGeo = useMemo(() => {
    const controlPoints = [];
    const segments = 15;
    const bendAmount = 1.5 + (idx % 3) * 1.2;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = t * trunkHeight;
      const bend = Math.pow(t, 2.2) * bendAmount;
      const twist = Math.sin(t * Math.PI * 1.5) * 0.3;
      controlPoints.push(new THREE.Vector3(bend + twist, y, 0));
    }
    const curve = new THREE.CatmullRomCurve3(controlPoints);
    return { curve, geo: new THREE.TubeGeometry(curve, 20, 0.25 + (idx % 2) * 0.1, 8, false) };
  }, [trunkHeight, idx]);

  // Tree rings
  const rings = useMemo(() => {
    const ringsData: { pos: THREE.Vector3; quat: THREE.Quaternion }[] = [];
    for (let i = 1; i < 8; i++) {
      const tt = i / 8;
      const p = trunkGeo.curve.getPointAt(tt);
      const t = trunkGeo.curve.getTangentAt(tt);
      const q = new THREE.Quaternion();
      const m = new THREE.Matrix4().lookAt(p, p.clone().add(t), new THREE.Vector3(0, 1, 0));
      q.setFromRotationMatrix(m);
      ringsData.push({ pos: p, quat: q });
    }
    return ringsData;
  }, [trunkGeo.curve]);

  // Canopy
  const topPos = useMemo(() => trunkGeo.curve.getPointAt(1.0), [trunkGeo.curve]);

  // Leaflets + coconuts
  const canopyGroup = useMemo(() => {
    const grp = new THREE.Group();
    grp.position.copy(topPos);
    const leafCount = 9 + (idx % 4);
    const leafs: THREE.Group[] = [];
    for (let i = 0; i < leafCount; i++) {
      const leaf = buildPalmLeaflets();
      const angle = (i / leafCount) * Math.PI * 2;
      const droop = 0.4 + Math.random() * 0.3;
      leaf.rotation.y = angle;
      leaf.rotation.x = -(Math.PI / 2.5) * droop;
      leaf.rotation.z = (Math.random() - 0.5) * 0.2;
      leaf.userData = { baseRotX: leaf.rotation.x, phase: i * 0.5 + Math.random() };
      leafs.push(leaf);
      grp.add(leaf);
    }
    // Coconuts
    const cocoCount = 2 + (idx % 3);
    for (let i = 0; i < cocoCount; i++) {
      const cGeo = new THREE.SphereGeometry(0.2, 12, 12);
      cGeo.scale(1, 0.9, 1);
      const cMat = new THREE.MeshStandardMaterial({ color: '#4a3728', roughness: 0.75, metalness: 0.1 });
      const coconut = new THREE.Mesh(cGeo, cMat);
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.random() * 0.2;
      coconut.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
      coconut.position.y -= 0.8;
      grp.add(coconut);
    }
    return { group: grp, leafs };
  }, [topPos, idx]);

  useEffect(() => { leafRefs.current = canopyGroup.leafs as any; }, [canopyGroup.leafs]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const off = idx * 0.7;
    groupRef.current.rotation.x = Math.sin(t * 1.2 + off) * 0.02;
    groupRef.current.rotation.z = Math.cos(t * 0.96 + off) * 0.015;

    leafRefs.current.forEach((leaf: any) => {
      const ph = leaf.userData?.phase || 0;
      const ws = 0.06 + Math.sin(t * 0.3) * 0.02;
      leaf.rotation.x = leaf.userData?.baseRotX + Math.sin(t * 2.5 + ph) * ws;
      leaf.rotation.z = Math.sin(t * 1.8 + ph * 2) * 0.03;
    });
  });

  return (
    <group ref={groupRef} position={position} rotation-y={idx * 0.8}>
      {/* Trunk */}
      <mesh geometry={trunkGeo.geo}>
        <meshStandardMaterial color="#5c4033" roughness={0.9} metalness={0} />
      </mesh>
      {/* Rings */}
      {rings.map((r, i) => (
        <mesh key={`ring-${i}`} position={r.pos} quaternion={r.quat}>
          <torusGeometry args={[0.28 + i * 0.02, 0.03, 6, 16]} />
          <meshStandardMaterial color="#4a3428" roughness={0.95} />
        </mesh>
      ))}
      {/* Canopy */}
      <primitive object={canopyGroup.group} />
    </group>
  );
}

function PalmForest() {
  const positions: [number, number, number][] = useMemo(() => [
    [-50, 0, 52], [-35, 0, 62], [-18, 0, 58],
    [5, 0, 65], [28, 0, 58], [45, 0, 52],
    [-62, 0, 45], [58, 0, 48],
  ], []);
  return <>{positions.map((p, i) => <PalmTree key={`palm-${i}`} idx={i} position={p} />)}</>;
}

// ═══════════════════════════════════════════════════════════════
// Seagulls
// ═══════════════════════════════════════════════════════════════
function Seagull({ idx }: { idx: number }) {
  const ref = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  const path = useMemo(() => ({
    cx: (rng(idx * 13)() - 0.5) * 100,
    cz: (rng(idx * 17)() - 0.5) * 50 - 15,
    rad: 25 + rng(idx * 19)() * 40,
    spd: 0.25 + rng(idx * 23)() * 0.35,
    alt: 18 + rng(idx * 29)() * 25,
    phase: rng(idx * 31)() * Math.PI * 2,
    vertAmp: 4 + rng(idx * 37)() * 5,
  }), [idx]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const p = path;
    const ang = t * p.spd + p.phase;
    ref.current.position.set(p.cx + Math.cos(ang) * p.rad, p.alt + Math.sin(ang * 2.5) * p.vertAmp, p.cz + Math.sin(ang) * p.rad);
    ref.current.rotation.y = ang + Math.PI / 2 + Math.sin(ang) * 0.15;
    ref.current.rotation.z = Math.sin(t * 3) * 0.08;
    const flap = Math.sin(t * 9) * 0.6;
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;
  });

  return (
    <group ref={ref} scale={0.85}>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.28, 1.1, 5]} />
        <meshStandardMaterial color="#fafafa" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, -0.55]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#fafafa" roughness={0.6} />
      </mesh>
      <mesh ref={wingL} position={[-0.9, 0, 0]}>
        <planeGeometry args={[1.8, 0.55]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={wingR} position={[0.9, 0, 0]}>
        <planeGeometry args={[1.8, 0.55]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Seagulls() {
  return <>{Array.from({ length: 6 }, (_, i) => <Seagull key={`gull-${i}`} idx={i} />)}</>;
}

// ═══════════════════════════════════════════════════════════════
// Jumping fish
// ═══════════════════════════════════════════════════════════════
function Fish({ idx, onSplash }: { idx: number; onSplash: (x: number, z: number) => void }) {
  const ref = useRef<THREE.Group>(null);
  const timeRef = useRef(rng(idx * 41)() * 8);
  const nextJumpRef = useRef(6 + rng(idx * 43)() * 10);
  const activeRef = useRef(false);
  const startTRef = useRef(0);
  const startXRef = useRef(0);
  const startZRef = useRef(0);
  const peakRef = useRef(4 + rng(idx * 47)() * 5);
  const hue = 0.07 + idx * 0.02;

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    timeRef.current += delta;

    if (!activeRef.current && timeRef.current > nextJumpRef.current) {
      timeRef.current = 0;
      activeRef.current = true;
      startTRef.current = clock.getElapsedTime();
      startXRef.current = (rng(idx * 53)() - 0.5) * 70;
      startZRef.current = (rng(idx * 59)() - 0.5) * 50;
      peakRef.current = 4 + rng(idx * 61)() * 5;
      ref.current.visible = true;
      ref.current.position.set(startXRef.current, 0, startZRef.current);
    }

    if (activeRef.current) {
      const prog = (clock.getElapsedTime() - startTRef.current) / 1.8;
      if (prog >= 1) {
        activeRef.current = false;
        ref.current.visible = false;
        onSplash(ref.current.position.x, ref.current.position.z);
      } else {
        const p = 2 * prog - 1;
        ref.current.position.y = peakRef.current * (1 - p * p);
        ref.current.position.x = startXRef.current + prog * 18;
        ref.current.rotation.x = -p * 0.6;
      }
    }
  });

  return (
    <group ref={ref} visible={false}>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.28, 1.3, 8]} />
        <meshStandardMaterial color={new THREE.Color().setHSL(hue, 0.85, 0.52)} roughness={0.4} metalness={0.15} />
      </mesh>
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0.75]}>
        <coneGeometry args={[0.22, 0.55, 4]} />
        <meshStandardMaterial color={new THREE.Color().setHSL(hue, 0.85, 0.52)} roughness={0.4} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.15, -0.1]} rotation={[-0.3, 0, 0]}>
        <coneGeometry args={[0.08, 0.3, 3]} />
        <meshStandardMaterial color={new THREE.Color().setHSL(hue, 0.85, 0.52)} roughness={0.4} metalness={0.15} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// Foam particles (simple CPU-updated, no custom shader)
// ═══════════════════════════════════════════════════════════════
function FoamParticles() {
  const ref = useRef<THREE.Points>(null);
  const { geometry, phases } = useMemo(() => {
    const count = 600;
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 200;
      pos[i*3+1] = 0.15;
      pos[i*3+2] = (Math.random() - 0.5) * 200;
      ph[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geometry: g, phases: ph };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const pos = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < phases.length; i++) {
      const px = pos[i*3];
      const pz = pos[i*3+2];
      pos[i*3+1] = Math.sin(px * 0.05 + t * 0.5 + phases[i]) * Math.cos(pz * 0.03 + t * 0.4) * 1.5
                 + Math.sin(px * 0.1 + t * 1.3) * 0.5 + 0.2;
    }
    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#ffffff" size={0.35} transparent opacity={0.5}
        depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

// ═══════════════════════════════════════════════════════════════
// Ripple ring
// ═══════════════════════════════════════════════════════════════
function Ripple({ pos, onDone }: { pos: THREE.Vector3; onDone: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.RingGeometry(0.15, 0.4, 48), []);
  const startTime = useRef(0);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (!startTime.current) startTime.current = clock.getElapsedTime();
    const age = clock.getElapsedTime() - startTime.current;
    const life = 3.5;
    const tt = age / life;
    ref.current.scale.setScalar(1 + tt * 20);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - tt) * 0.7);
    if (tt >= 1) onDone();
  });

  return (
    <mesh ref={ref} geometry={geo} position={[pos.x, 0.12, pos.z]} rotation={[-Math.PI/2, 0, 0]}>
      <meshBasicMaterial color="#ffffff" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════════
// Splash particles
// ═══════════════════════════════════════════════════════════════
function Splash({ pos, intensity = 1, onDone }: { pos: THREE.Vector3; intensity?: number; onDone: () => void }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const c = Math.floor(40 * intensity);
    const arr = new Float32Array(c * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, [intensity]);
  const vels = useMemo(() => {
    const c = Math.floor(40 * intensity);
    return new Float32Array(c * 3);
  }, [intensity]);
  const startTime = useRef(0);

  useEffect(() => {
    const c = Math.floor(40 * intensity);
    const posArr = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < c; i++) {
      posArr[i*3]   = pos.x + (Math.random() - 0.5) * 2;
      posArr[i*3+1] = 0.5;
      posArr[i*3+2] = pos.z + (Math.random() - 0.5) * 2;
      vels[i*3]   = (Math.random() - 0.5) * 10 * intensity;
      vels[i*3+1] = 6 + Math.random() * 12 * intensity;
      vels[i*3+2] = (Math.random() - 0.5) * 10 * intensity;
    }
    geo.attributes.position.needsUpdate = true;
  }, [pos.x, pos.z, intensity]);

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    if (!startTime.current) startTime.current = clock.getElapsedTime();
    const age = clock.getElapsedTime() - startTime.current;
    const life = 2.2;
    const tt = age / life;
    const posArr = geo.attributes.position.array as Float32Array;
    const c = Math.floor(40 * intensity);
    for (let i = 0; i < c; i++) {
      vels[i*3+1] -= 18 * delta;
      posArr[i*3]   += vels[i*3] * delta;
      posArr[i*3+1] += vels[i*3+1] * delta;
      posArr[i*3+2] += vels[i*3+2] * delta;
    }
    geo.attributes.position.needsUpdate = true;
    (ref.current.material as THREE.PointsMaterial).opacity = Math.max(0, (1 - tt) * 0.85);
    if (tt >= 1) onDone();
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#e8f4fc" size={0.18} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tone mapping setup
// ═══════════════════════════════════════════════════════════════
function ToneMappingSetup() {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 2.5;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);
  return null;
}

// ═══════════════════════════════════════════════════════════════
// Main BeachScene
// ═══════════════════════════════════════════════════════════════
interface RippleItem { id: number; point: THREE.Vector3 }
interface SplashItem { id: number; point: THREE.Vector3; intensity: number }

export function BeachScene({ autoRotate = false }: { autoRotate?: boolean; effects?: any }) {
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const [splashes, setSplashes] = useState<SplashItem[]>([]);
  const nextId = useRef(0);

  const spawnRipple = useCallback((x: number, z: number) => {
    const id = nextId.current++;
    setRipples(p => [...p, { id, point: new THREE.Vector3(x, 0, z) }]);
  }, []);

  const spawnSplash = useCallback((x: number, z: number, intensity = 0.6) => {
    const id = nextId.current++;
    setSplashes(p => [...p, { id, point: new THREE.Vector3(x, 0, z), intensity }]);
  }, []);

  const handleOceanClick = useCallback((pt: THREE.Vector3) => {
    spawnRipple(pt.x, pt.z);
    spawnSplash(pt.x, pt.z, 0.6);
  }, [spawnRipple, spawnSplash]);

  const handleFishSplash = useCallback((x: number, z: number) => {
    spawnRipple(x, z);
    spawnSplash(x, z, 0.35);
  }, [spawnRipple, spawnSplash]);

  return (
    <>
      {/* Atmosphere */}
      <ToneMappingSetup />
      <SkyBackground />
      <SkyDome />
      <SunAndLight />
      <fogExp2 attach="fog" args={['#4D9BFF', 0.0008]} />

      {/* Lighting */}
      <ambientLight intensity={0.7} color="#FFFFFF" />
      <hemisphereLight intensity={0.6} color="#87CEEB" groundColor="#004466" />
      <directionalLight intensity={0.8} color="#E6F3FF" position={[-50, 20, -50]} />
      <pointLight intensity={0.3} color="#FFF5E6" position={[0, 10, 50]} distance={100} />

      {/* Scene elements */}
      <Ocean onClick={handleOceanClick} />
      <Beach />
      <Rocks />
      <PalmForest />
      <Seagulls />
      {Array.from({ length: 4 }, (_, i) => (
        <Fish key={`fish-${i}`} idx={i} onSplash={handleFishSplash} />
      ))}
      <FoamParticles />

      {/* Ripples */}
      {ripples.map(r => (
        <Ripple key={r.id} pos={r.point} onDone={() => setRipples(p => p.filter(x => x.id !== r.id))} />
      ))}

      {/* Splashes */}
      {splashes.map(s => (
        <Splash key={s.id} pos={s.point} intensity={s.intensity}
          onDone={() => setSplashes(p => p.filter(x => x.id !== s.id))} />
      ))}

      {/* Orbit controls */}
      <OrbitControls
        enableDamping dampingFactor={0.05}
        minDistance={20} maxDistance={120}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 2, 0]}
      />
    </>
  );
}
