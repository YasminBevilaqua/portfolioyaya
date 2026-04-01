import { Html } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  ABOUT_PLANET_TEXTURE_SEEDS,
  BACKGROUND_MATCH_SPIN_Y,
  SITE_PLANET_PALETTES,
  getOrCreatePlanetTextureCanvas,
  planetMaterialStyle,
  type PlanetTextureVariant,
} from '@/lib/aboutPlanetTextures';
import type { PlanetFocusIndex } from '@/lib/aboutPlanetLayout';
import { ABOUT_PLANET_TAB_LABELS } from './AboutPlanet';

const TEXTURE_VARIANTS: PlanetTextureVariant[] = ['gas-orange', 'gas-pink', 'jupiter-purple'];

/** Espaçamento entre centros — planetas iguais (mesmo raio). */
const STEP = 1.12;
const R = 0.4;

function MiniPlanetMesh({
  planetIndex,
  selected,
  onPick,
}: {
  planetIndex: PlanetFocusIndex;
  selected: boolean;
  onPick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const palette = SITE_PLANET_PALETTES[planetIndex] as [string, string, string];
  const textureSeed = ABOUT_PLANET_TEXTURE_SEEDS[planetIndex];
  const textureVariant = TEXTURE_VARIANTS[planetIndex];
  const mat = planetMaterialStyle(textureVariant);
  const texture = useMemo(() => {
    const canvas = getOrCreatePlanetTextureCanvas(palette, textureSeed, textureVariant);
    const tex = new THREE.CanvasTexture(canvas as HTMLCanvasElement);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [palette, textureSeed, textureVariant]);

  useFrame((_, delta) => {
    const m = meshRef.current;
    if (m) m.rotation.y += BACKGROUND_MATCH_SPIN_Y * delta;
  });

  const x = (planetIndex - 1) * STEP;
  const scaleMul = selected ? 1.12 : 1;
  const labelY = -(R * scaleMul + 0.22);

  return (
    <group position={[x, 0, 0]}>
      <group scale={scaleMul}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onPick();
          }}
        >
          <sphereGeometry args={[R, 40, 40]} />
          <meshStandardMaterial
            map={texture}
            color="#ffffff"
            roughness={mat.roughness}
            metalness={mat.metalness}
            emissive={mat.emissive}
            emissiveIntensity={selected ? mat.emissiveIntensity + 0.12 : mat.emissiveIntensity}
            transparent
          />
        </mesh>
      </group>
      <Html
        position={[0, labelY, 0]}
        center
        transform
        occlude={false}
        distanceFactor={5.2}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          className={`text-[11px] font-semibold tracking-tight ${
            selected ? 'text-white' : 'text-white/80'
          }`}
          style={{ textShadow: '0 1px 10px rgba(0,0,0,0.85)' }}
        >
          {ABOUT_PLANET_TAB_LABELS[planetIndex]}
        </span>
      </Html>
    </group>
  );
}

function PickerScene({
  focusIndex,
  onSelectPlanet,
}: {
  focusIndex: PlanetFocusIndex;
  onSelectPlanet: (index: PlanetFocusIndex | null) => void;
}) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [invalidate, focusIndex]);

  return (
    <>
      <ambientLight intensity={0.52} />
      <directionalLight position={[5, 4, 6]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-4, 2, -3]} intensity={0.32} color="#ddd6fe" />
      {([0, 1, 2] as const).map((i) => (
        <MiniPlanetMesh
          key={i}
          planetIndex={i}
          selected={focusIndex === i}
          onPick={() => onSelectPlanet(focusIndex === i ? null : i)}
        />
      ))}
    </>
  );
}

/**
 * Fileira dos 3 planetas (WebGL) — só mobile; mesmas texturas que o canvas principal.
 */
export default function AboutPlanetMobilePickers({
  focusIndex,
  onSelectPlanet,
}: {
  focusIndex: PlanetFocusIndex;
  onSelectPlanet: (index: PlanetFocusIndex | null) => void;
}) {
  return (
    <div
      className="relative z-30 mx-auto -mt-2 h-[min(10.5rem,28vw)] min-h-[9.5rem] w-full max-w-lg shrink-0 px-1 md:hidden"
      role="group"
      aria-label="Planetas — toque para alternar"
    >
      <Canvas
        camera={{ position: [0, 0.02, 2.55], fov: 36, near: 0.1, far: 24 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        className="touch-none [&>canvas]:h-full [&>canvas]:w-full"
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#000000', 0);
          scene.background = null;
        }}
      >
        <Suspense fallback={null}>
          <PickerScene focusIndex={focusIndex} onSelectPlanet={onSelectPlanet} />
        </Suspense>
      </Canvas>
    </div>
  );
}
