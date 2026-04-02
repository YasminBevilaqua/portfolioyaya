import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import {
  ABOUT_PLANET_TEXTURE_SEEDS,
  BACKGROUND_MATCH_SPIN_Y,
  SITE_PLANET_PALETTES,
  type PlanetTextureVariant,
  getOrCreatePlanetTextureCanvas,
  planetMaterialStyle,
  planetTextureKey,
} from '@/lib/aboutPlanetTextures';
import {
  FOCUS_LOOK_AT_BIAS_X,
  FOCUS_MODE_VFOV,
  IDLE_LOOK_AT_BIAS_X,
  getCameraTarget,
  getMinFocusCameraZForAspect,
  getMinIdleCameraZForAspect,
  getPlanetLayout,
  IDLE_CAMERA_Z,
  PLANET_RADII,
  type PlanetFocusIndex,
} from '@/lib/aboutPlanetLayout';
import { ExperienceTimeline } from '@/components/Experience';
import { TechIconsGrid } from '@/components/TechStack';

const TEXTURE_VARIANTS: PlanetTextureVariant[] = ['gas-orange', 'gas-pink', 'jupiter-purple'];
const PLANET_TEXTURE_CACHE = new Map<string, THREE.CanvasTexture>();

export const ABOUT_PLANET_TAB_LABELS: Record<PlanetFocusIndex, string> = {
  0: 'Experiência',
  1: 'Stack',
  2: 'Quem Sou',
};

const PLANET_NAMES = ABOUT_PLANET_TAB_LABELS;

/** Tela 1 — idle: nenhum planeta selecionado. */
const PLANET_LABEL_FONT_SCREEN1 = 'clamp(12px, 2.4vw, 19px)';
/** Tela 2 — planeta selecionado (primeiro plano). */
const PLANET_LABEL_FONT_SCREEN2_FOCUSED = 'clamp(26px, 5vw, 44px)';
/** Tela 2 — planetas em segundo plano. */
const PLANET_LABEL_FONT_SCREEN2_BACK = 'clamp(9px, 1.65vw, 13px)';

const DRAG_SENS = 0.009;
const CLICK_DRAG_PX = 8;

/** Evita saltos de scroll quando o layout do modo foco aumenta a altura da página. */
function restoreScrollPositionImmediate(y: number) {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, y);
  html.style.scrollBehavior = prev;
}

const FOCUS_COPY: { title: string; body: string; body2?: string; body3?: string }[] = [
  {
    title: 'Experiência & stack',
    body: 'Formação em ADS e foco em front-end moderno: React, TypeScript e interfaces responsivas, com atenção a performance e acessibilidade.',
  },
  {
    title: 'O que me move',
    body: 'Criar experiências visuais e interativas — animações, WebGL e Canvas — com código limpo e escalável.',
  },
  {
    title: 'Eu sou',
    body:
      'Desenvolvedora Front-End focada na construção de interfaces estruturadas e consistentes. Trabalho com componentização, arquitetura de interface e layouts responsivos, explorando animações e renderização com Canvas e experiências 3D com Three.js.',
    body2:
      'Tenho interesse em trabalhar com interfaces bem definidas, onde cada elemento tem função clara e o comportamento acompanha a lógica do sistema alinhado à estrutura do projeto.',
    body3:
      'Fora do código, gosto de desenhar e tocar ocarina— dois espaços onde também trabalho composição, ritmo e detalhe.  :)',
  },
];

/** ~45°: FOV muito alto (ex.: 90°+) distorce a perspetiva e as esferas parecem elipses horizontais. */
const FOV_DEFAULT = 45;
/** Igual a `FOCUS_MODE_VFOV` em `aboutPlanetLayout` — zoom no modo foco; não alterar só num dos ficheiros. */
const FOV_FOCUS = FOCUS_MODE_VFOV;

/** Amortecimento no idle e ao sair do foco. */
const DAMP = 2.85;
/** Câmara e posição das esferas em foco — mais baixo = mais suave (tela 2, cliques entre planetas). */
const DAMP_FOCUS = 1.12;
/** Escala em foco: alinhada à posição para não “saltar” após a troca. */
const DAMP_FOCUS_SCALE = 0.95;
/**
 * Troca planeta ↔ planeta: escala antecede à posição (raio diminui antes de cruzar trilhos),
 * mais arco XZ + desvio em Z/Y para não intersectar volumes.
 */
const FOCUS_SWAP_DURATION = 1.14;
const FOCUS_SWAP_ARC_XZ = 1.12;
const FOCUS_SWAP_ARC_Z = 0.56;
const FOCUS_SWAP_ARC_Y = 0.21;
/** Fração da duração em que a escala já chega ao alvo (posição usa o resto + atraso). */
const FOCUS_SWAP_SCALE_LEAD = 0.42;
/** Atraso antes da posição acompanhar de vez (após escala já ter avançado). */
const FOCUS_SWAP_POS_DELAY = 0.18;
/** Evita saltos se o tab ficar em background e `delta` explodir. */
const MAX_DELTA = 1 / 30;

function focusLerpK(delta: number, damp: number): number {
  const d = Math.min(delta, MAX_DELTA);
  return 1 - Math.exp(-damp * d);
}

function smoothstep01(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
}

/** Curva 5ª ordem (Perlin) — aceleração mais suave nas trocas planeta ↔ planeta (tela 2). */
function smootherstep01(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return u * u * u * (u * (u * 6 - 15) + 10);
}

/** Duração (s) do fade dos 3 planetas antes de trocar o layout / foco. */
const FADE_OUT_DURATION = 0.48;
/** Duração (s) do fade in do modo foco ou do regresso ao idle. */
const FADE_IN_DURATION = 0.52;

type FocusTransitionPhase = 'none' | 'fadeOut' | 'fadeIn';

/** Só a primeira escolha (idle → foco) usa fade; trocas entre planetas animam com lerp, sem esta fila. */
type PendingFocusAction = { kind: 'open'; index: PlanetFocusIndex };

function CameraRig({
  focusIndex,
  transitionPhase,
}: {
  focusIndex: PlanetFocusIndex | null;
  transitionPhase: FocusTransitionPhase;
}) {
  const { camera, gl } = useThree();
  const lookRef = useRef(new THREE.Vector3(0, 0, 0));
  const lookScratch = useRef(new THREE.Vector3(0, 0, 0));

  /** Prioridade >0 em useFrame desativa o `gl.render()` automático do R3F (cena WebGL deixa de desenhar). */
  useFrame((_, delta) => {
    const p = camera as THREE.PerspectiveCamera;
    const el = gl.domElement;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw > 0 && ch > 0) {
      const ar = cw / ch;
      if (Math.abs(p.aspect - ar) > 1e-7) p.aspect = ar;
    }

    const target = getCameraTarget(focusIndex);
    if (cw > 0 && ch > 0) {
      const aspect = cw / ch;
      if (focusIndex === null) {
        const minZ = getMinIdleCameraZForAspect(aspect);
        target.z = Math.max(target.z, minZ);
      } else {
        const minZ = getMinFocusCameraZForAspect(aspect, focusIndex);
        target.z = Math.max(target.z, minZ);
      }
    }

    const transitioning = transitionPhase !== 'none';

    if (focusIndex !== null) {
      if (transitioning) {
        camera.position.copy(target);
        lookScratch.current.copy(getPlanetLayout(focusIndex, focusIndex).position);
        lookScratch.current.x -= FOCUS_LOOK_AT_BIAS_X;
        lookRef.current.copy(lookScratch.current);
        camera.lookAt(lookRef.current);
        p.fov = FOV_FOCUS;
        p.updateProjectionMatrix();
        return;
      }
      const k = focusLerpK(delta, DAMP_FOCUS);
      camera.position.lerp(target, k);
      lookScratch.current.copy(getPlanetLayout(focusIndex, focusIndex).position);
      lookScratch.current.x -= FOCUS_LOOK_AT_BIAS_X;
      lookRef.current.lerp(lookScratch.current, k);
      camera.lookAt(lookRef.current);
      p.fov = THREE.MathUtils.lerp(p.fov, FOV_FOCUS, k);
      p.updateProjectionMatrix();
      return;
    }

    if (transitioning) {
      camera.position.copy(target);
      lookScratch.current.set(-IDLE_LOOK_AT_BIAS_X, 0, 0);
      lookRef.current.copy(lookScratch.current);
      camera.lookAt(lookRef.current);
      p.fov = FOV_DEFAULT;
      p.updateProjectionMatrix();
      return;
    }

    const k = 1 - Math.exp(-DAMP * Math.min(delta, MAX_DELTA));
    camera.position.lerp(target, k);
    p.fov = THREE.MathUtils.lerp(p.fov, FOV_DEFAULT, k);
    lookScratch.current.set(-IDLE_LOOK_AT_BIAS_X, 0, 0);
    lookRef.current.lerp(lookScratch.current, k);
    camera.lookAt(lookRef.current);
    p.updateProjectionMatrix();
  });

  return null;
}

function FocusTransitionBridge({
  phase,
  fadeMulRef,
  onFadeOutComplete,
  onFadeInComplete,
  onFadeMultiplier,
}: {
  phase: FocusTransitionPhase;
  fadeMulRef: MutableRefObject<number>;
  onFadeOutComplete: () => void;
  onFadeInComplete: () => void;
  onFadeMultiplier: (mul: number) => void;
}) {
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const tRef = useRef(0);
  const endedFadeOutRef = useRef(false);
  const endedFadeInRef = useRef(false);
  /** Última fase processada no loop R3F — `useEffect` chega tarde demais; sem isto o fadeIn começa com `t` já no fim do fadeOut. */
  const lastPhaseInFrameRef = useRef(phase);

  /** Prioridade negativa: corre antes dos planetas para `fadeMulRef` estar atualizado no mesmo frame. */
  useFrame((_, delta) => {
    const p = phaseRef.current;
    if (p !== lastPhaseInFrameRef.current) {
      lastPhaseInFrameRef.current = p;
      tRef.current = 0;
      endedFadeOutRef.current = false;
      endedFadeInRef.current = false;
    }
    const d = Math.min(delta, MAX_DELTA);
    if (p === 'none') {
      /** Evitar `setUiFade(1)` ~60×/s em idle — re-renders do Canvas repõem props e “saltam” o fade. */
      if (Math.abs(fadeMulRef.current - 1) > 1e-5) {
        onFadeMultiplier(1);
      }
      return;
    }
    if (p === 'fadeOut') {
      tRef.current += d;
      const u = Math.min(1, tRef.current / FADE_OUT_DURATION);
      const sm = smoothstep01(u);
      onFadeMultiplier(1 - sm);
      if (u >= 1 && !endedFadeOutRef.current) {
        endedFadeOutRef.current = true;
        onFadeOutComplete();
      }
      return;
    }
    if (p === 'fadeIn') {
      tRef.current += d;
      const u = Math.min(1, tRef.current / FADE_IN_DURATION);
      const sm = smoothstep01(u);
      onFadeMultiplier(sm);
      if (u >= 1 && !endedFadeInRef.current) {
        endedFadeInRef.current = true;
        onFadeInComplete();
      }
    }
  }, -1);

  return null;
}

function InteractivePlanet({
  planetIndex,
  palette,
  textureSeed,
  textureVariant,
  baseRadius,
  focusIndex,
  transitionPhase,
  fadeMulRef,
  uiFade,
  onPlanetTap,
  meshRef,
  occludeMeshes,
}: {
  planetIndex: PlanetFocusIndex;
  palette: (typeof SITE_PLANET_PALETTES)[number];
  textureSeed: number;
  textureVariant: PlanetTextureVariant;
  baseRadius: number;
  focusIndex: PlanetFocusIndex | null;
  transitionPhase: FocusTransitionPhase;
  fadeMulRef: MutableRefObject<number>;
  uiFade: number;
  onPlanetTap: (index: PlanetFocusIndex) => void;
  /** Ref na mesh da esfera — usada para oclusão dos outros planetas. */
  meshRef: MutableRefObject<THREE.Mesh | null>;
  /** Meshes dos outros planetas: o `Html` esconde o nome se um deles cortar o raio até ao rótulo. */
  occludeMeshes: MutableRefObject<THREE.Object3D | null>[];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleGroupRef = useRef<THREE.Group>(null);
  const labelInvRef = useRef<THREE.Group>(null);
  const animInit = useRef(false);
  const prevFocusForSwapRef = useRef<PlanetFocusIndex | null | undefined>(undefined);
  const focusSwapRef = useRef<{
    t: number;
    startPos: THREE.Vector3;
    startScale: number;
  } | null>(null);
  const swapDispRef = useRef(new THREE.Vector3());
  const swapFlatRef = useRef(new THREE.Vector3());
  const swapPerpRef = useRef(new THREE.Vector3());
  const dragging = useRef(false);
  const pointerStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const { gl } = useThree();
  const mat = planetMaterialStyle(textureVariant);
  const texture = useMemo(() => {
    const key = planetTextureKey(palette, textureSeed, textureVariant);
    const cached = PLANET_TEXTURE_CACHE.get(key);
    if (cached) return cached;
    const canvas = getOrCreatePlanetTextureCanvas(palette, textureSeed, textureVariant);
    const tex = new THREE.CanvasTexture(canvas as HTMLCanvasElement);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    /** Mipmaps acentuam a costura UV nas bordas u=0 / u=1. */
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    PLANET_TEXTURE_CACHE.set(key, tex);
    return tex;
  }, [palette, textureSeed, textureVariant]);

  const focusIndexRef = useRef(focusIndex);
  focusIndexRef.current = focusIndex;
  const transitionPhaseRef = useRef(transitionPhase);
  transitionPhaseRef.current = transitionPhase;

  const layoutOpacity = useMemo(
    () => getPlanetLayout(focusIndex, planetIndex).opacity,
    [focusIndex, planetIndex],
  );
  const meshSurfaceOpacity = Math.min(1, Math.max(0, layoutOpacity * uiFade));

  const layoutOpacityRef = useRef(layoutOpacity);
  layoutOpacityRef.current = layoutOpacity;

  useLayoutEffect(() => {
    if (focusIndex === null) {
      focusSwapRef.current = null;
      prevFocusForSwapRef.current = null;
      return;
    }
    const prev = prevFocusForSwapRef.current;
    if (
      prev !== undefined &&
      prev !== null &&
      prev !== focusIndex &&
      groupRef.current &&
      scaleGroupRef.current
    ) {
      focusSwapRef.current = {
        t: 0,
        startPos: groupRef.current.position.clone(),
        startScale: scaleGroupRef.current.scale.x,
      };
    }
    prevFocusForSwapRef.current = focusIndex;
  }, [focusIndex]);

  useFrame((_, delta) => {
    if (!groupRef.current || !scaleGroupRef.current || !labelInvRef.current || !meshRef.current) return;
    meshRef.current.rotation.y += BACKGROUND_MATCH_SPIN_Y * delta;

    /**
     * Opacidade no material: usar `fadeMulRef` (atualizado no mesmo frame que o bridge, antes deste useFrame),
     * não só `uiFade` do React — o estado pode atrasar um frame e o reconciler com `map` ignora mal `opacity` no JSX.
     */
    {
      const mesh = meshRef.current;
      const m = mesh.material as THREE.MeshStandardMaterial;
      const o = Math.min(1, Math.max(0, layoutOpacityRef.current * fadeMulRef.current));
      m.opacity = o;
      m.transparent = true;
      m.depthWrite = o > 0.5;
      mesh.visible = o > 1e-4;
    }

    const fi = focusIndexRef.current;
    const phase = transitionPhaseRef.current;
    const { position, scaleMul } = getPlanetLayout(fi, planetIndex);
    const targetScale = baseRadius * scaleMul;

    const applyLabelFollow = (s: number) => {
      labelInvRef.current!.position.set(0, 1.22 * s, 0);
      labelInvRef.current!.scale.set(1, 1, 1);
    };

    if (!animInit.current) {
      groupRef.current.position.copy(position);
      scaleGroupRef.current.scale.setScalar(targetScale);
      applyLabelFollow(targetScale);
      animInit.current = true;
      return;
    }

    if (phase !== 'none') {
      groupRef.current.position.copy(position);
      scaleGroupRef.current.scale.setScalar(targetScale);
      applyLabelFollow(targetScale);
      return;
    }

    if (fi !== null) {
      const swap = focusSwapRef.current;
      if (swap) {
        const d = Math.min(delta, MAX_DELTA);
        swap.t += d;
        const T = FOCUS_SWAP_DURATION;
        const rawT = Math.min(1, swap.t / T);
        const uScale = smootherstep01(Math.min(1, rawT / FOCUS_SWAP_SCALE_LEAD));
        const posPhase = Math.max(0, rawT - FOCUS_SWAP_POS_DELAY) / (1 - FOCUS_SWAP_POS_DELAY);
        const uPos = smootherstep01(Math.min(1, posPhase));
        const disp = swapDispRef.current.subVectors(position, swap.startPos);
        const flat = swapFlatRef.current.copy(swap.startPos).lerp(position, uPos);
        const perp = swapPerpRef.current.set(-disp.z, 0, disp.x);
        if (perp.lengthSq() > 1e-8) {
          perp.normalize();
          const bow = Math.sin(Math.PI * uPos);
          const w = planetIndex === 1 ? 0.92 : 1.12;
          flat.addScaledVector(perp, bow * FOCUS_SWAP_ARC_XZ * w);
        }
        const bowZ = Math.sin(Math.PI * uPos);
        flat.z += bowZ * FOCUS_SWAP_ARC_Z * Math.sin((planetIndex + 0.37) * 2.15);
        const ySign = planetIndex - 1;
        flat.y += bowZ * FOCUS_SWAP_ARC_Y * ySign;
        groupRef.current.position.copy(flat);
        const s = THREE.MathUtils.lerp(swap.startScale, targetScale, uScale);
        scaleGroupRef.current.scale.setScalar(s);
        applyLabelFollow(s);
        if (swap.t >= T) {
          focusSwapRef.current = null;
          groupRef.current.position.copy(position);
          scaleGroupRef.current.scale.setScalar(targetScale);
          applyLabelFollow(targetScale);
        }
        return;
      }
      const kPos = focusLerpK(delta, DAMP_FOCUS);
      const kScale = focusLerpK(delta, DAMP_FOCUS_SCALE);
      groupRef.current.position.lerp(position, kPos);
      const s = THREE.MathUtils.lerp(scaleGroupRef.current.scale.x, targetScale, kScale);
      scaleGroupRef.current.scale.setScalar(s);
      applyLabelFollow(s);
      return;
    }

    const k = 1 - Math.exp(-DAMP * Math.min(delta, MAX_DELTA));
    groupRef.current.position.lerp(position, k);
    const s = THREE.MathUtils.lerp(scaleGroupRef.current.scale.x, targetScale, k);
    scaleGroupRef.current.scale.setScalar(s);
    applyLabelFollow(s);
  });

  const setCanvasCursor = (c: string) => {
    gl.domElement.style.cursor = c;
  };

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (transitionPhase !== 'none') return;
    e.stopPropagation();
    dragging.current = true;
    hasDragged.current = false;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    last.current = { x: e.clientX, y: e.clientY };
    setCanvasCursor('grabbing');

    const onWindowMove = (ev: PointerEvent) => {
      if (!dragging.current || !meshRef.current) return;
      const dist = Math.hypot(ev.clientX - pointerStart.current.x, ev.clientY - pointerStart.current.y);
      if (dist > CLICK_DRAG_PX) hasDragged.current = true;
      const dx = ev.clientX - last.current.x;
      const dy = ev.clientY - last.current.y;
      last.current = { x: ev.clientX, y: ev.clientY };
      meshRef.current.rotation.y += dx * DRAG_SENS;
      meshRef.current.rotation.x += dy * DRAG_SENS;
    };

    const onWindowUp = () => {
      if (dragging.current && !hasDragged.current) {
        onPlanetTap(planetIndex);
      }
      dragging.current = false;
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
      setCanvasCursor('grab');
    };

    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowUp);
  };

  const labelScreen1 = focusIndex === null;
  const labelFocused = focusIndex === planetIndex;
  const planetLabelFontSize = labelScreen1
    ? PLANET_LABEL_FONT_SCREEN1
    : labelFocused
      ? PLANET_LABEL_FONT_SCREEN2_FOCUSED
      : PLANET_LABEL_FONT_SCREEN2_BACK;

  return (
    <group ref={groupRef}>
      <group ref={scaleGroupRef}>
        <mesh
          ref={meshRef}
          onPointerDown={onPointerDown}
          onPointerOver={() => {
            if (!dragging.current) setCanvasCursor('grab');
          }}
          onPointerOut={() => {
            if (!dragging.current) setCanvasCursor('default');
          }}
        >
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            map={texture}
            color="#ffffff"
            roughness={mat.roughness}
            metalness={mat.metalness}
            emissive={mat.emissive}
            emissiveIntensity={mat.emissiveIntensity}
            transparent
          />
        </mesh>
      </group>

      <group ref={labelInvRef}>
        <Html
          position={[0, 0, 0]}
          center
          occlude={occludeMeshes}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
        <span
          style={{
            color: 'white',
            opacity: meshSurfaceOpacity,
            fontSize: planetLabelFontSize,
            fontWeight: labelScreen1 || labelFocused ? 700 : 500,
            letterSpacing: labelScreen1 ? '0.055em' : labelFocused ? '0.05em' : '0.028em',
            fontFamily: 'Sora, sans-serif',
            textShadow: '0 1px 8px rgba(0,0,0,0.55)',
            transition: 'font-size 0.5s ease, font-weight 0.5s ease',
          }}
        >
          {PLANET_NAMES[planetIndex]}
        </span>
      </Html>
      </group>
    </group>
  );
}

function Scene({
  focusIndex,
  transitionPhase,
  fadeMulRef,
  uiFade,
  onPlanetTap,
  onFadeOutComplete,
  onFadeInComplete,
  onFadeMultiplier,
}: {
  focusIndex: PlanetFocusIndex | null;
  transitionPhase: FocusTransitionPhase;
  fadeMulRef: MutableRefObject<number>;
  uiFade: number;
  onPlanetTap: (index: PlanetFocusIndex) => void;
  onFadeOutComplete: () => void;
  onFadeInComplete: () => void;
  onFadeMultiplier: (mul: number) => void;
}) {
  const planetMeshRef0 = useRef<THREE.Mesh>(null);
  const planetMeshRef1 = useRef<THREE.Mesh>(null);
  const planetMeshRef2 = useRef<THREE.Mesh>(null);
  const planetMeshRefs = [planetMeshRef0, planetMeshRef1, planetMeshRef2] as const;

  return (
    <>
      <FocusTransitionBridge
        phase={transitionPhase}
        fadeMulRef={fadeMulRef}
        onFadeOutComplete={onFadeOutComplete}
        onFadeInComplete={onFadeInComplete}
        onFadeMultiplier={onFadeMultiplier}
      />
      <CameraRig focusIndex={focusIndex} transitionPhase={transitionPhase} />
      <ambientLight intensity={0.48} />
      <directionalLight position={[12, 8, 10]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-6, 4, -4]} intensity={0.22} color="#ddd6fe" />
      {([0, 1, 2] as const).map((i) => (
        <InteractivePlanet
          key={i}
          planetIndex={i}
          palette={SITE_PLANET_PALETTES[i]}
          textureSeed={ABOUT_PLANET_TEXTURE_SEEDS[i]}
          textureVariant={TEXTURE_VARIANTS[i]}
          baseRadius={PLANET_RADII[i]}
          focusIndex={focusIndex}
          transitionPhase={transitionPhase}
          fadeMulRef={fadeMulRef}
          uiFade={uiFade}
          onPlanetTap={onPlanetTap}
          meshRef={planetMeshRefs[i]}
          occludeMeshes={planetMeshRefs.filter((_, j) => j !== i)}
        />
      ))}
    </>
  );
}

export default function AboutPlanet({
  focusIndex,
  onFocusChange,
}: {
  focusIndex: PlanetFocusIndex | null;
  onFocusChange: (index: PlanetFocusIndex | null) => void;
}) {
  const [transitionPhase, setTransitionPhase] = useState<FocusTransitionPhase>('none');
  const [uiFade, setUiFade] = useState(1);
  const fadeMulRef = useRef(1);
  const pendingRef = useRef<PendingFocusAction | null>(null);
  const scrollYToRestore = useRef<number | null>(null);
  const prevTransitionPhaseRef = useRef<FocusTransitionPhase>(transitionPhase);

  /** Garante opacidade 0 antes do paint ao entrar em fadeIn (alinha ref com o reset de `t` no bridge). */
  useLayoutEffect(() => {
    const prev = prevTransitionPhaseRef.current;
    prevTransitionPhaseRef.current = transitionPhase;
    if (prev === 'fadeOut' && transitionPhase === 'fadeIn') {
      fadeMulRef.current = 0;
      setUiFade(0);
    }
  }, [transitionPhase]);

  const beginFocusLayoutChange = () => {
    scrollYToRestore.current = window.scrollY;
  };

  useLayoutEffect(() => {
    if (scrollYToRestore.current === null) return;
    const y = scrollYToRestore.current;
    scrollYToRestore.current = null;
    restoreScrollPositionImmediate(y);
  }, [focusIndex]);

  const handleFadeOutComplete = useCallback(() => {
    const p = pendingRef.current;
    pendingRef.current = null;
    if (!p || p.kind !== 'open') return;
    onFocusChange(p.index);
    setTransitionPhase('fadeIn');
  }, []);

  const handleFadeInComplete = useCallback(() => {
    setTransitionPhase('none');
  }, []);

  const onFadeMultiplier = useCallback((mul: number) => {
    fadeMulRef.current = mul;
    setUiFade((prev) => (Math.abs(prev - mul) < 1e-4 ? prev : mul));
  }, []);

  const onPlanetTap = useCallback(
    (index: PlanetFocusIndex) => {
      if (transitionPhase !== 'none') return;
      beginFocusLayoutChange();
      if (focusIndex === null) {
        pendingRef.current = { kind: 'open', index };
        setTransitionPhase('fadeOut');
        return;
      }
      if (focusIndex === index) {
        onFocusChange(null);
        return;
      }
      onFocusChange(index);
    },
    [focusIndex, transitionPhase, onFocusChange],
  );

  const copy = focusIndex !== null ? FOCUS_COPY[focusIndex] : null;

  return (
    <div
      className={`mx-auto flex min-h-0 w-full flex-col gap-8 ${
        focusIndex === null
          ? 'overflow-x-hidden'
          : focusIndex === 1
            ? 'overflow-visible'
            : 'overflow-x-hidden max-lg:overflow-visible'
      } lg:flex-row lg:items-stretch ${
        focusIndex !== null
          ? 'mb-0 h-full min-h-0 w-full max-w-none flex-1 flex-col justify-between gap-4 sm:gap-5 lg:flex-row lg:gap-3 xl:gap-5'
          : 'max-w-6xl lg:gap-6 xl:gap-8'
      }`}
    >
      <aside
        className={`shrink-0 transition-opacity duration-300 ease-out ${
          focusIndex !== null
            ? focusIndex === 1
              ? /* Stack: coluna mais larga + overflow visível para o glow dos ícones (planetas/canvas inalterados) */
                'pointer-events-auto min-h-0 w-full max-h-none overflow-visible px-4 sm:px-5 md:px-6 lg:max-w-[min(100%,min(72rem,96vw))] lg:w-[min(100%,min(72rem,96vw))] lg:shrink-0 lg:basis-[min(100%,min(64rem,66vw))] lg:flex-none lg:pl-8 xl:pl-12 2xl:pl-16 lg:pr-5'
              : `pointer-events-auto min-h-0 w-full max-w-[min(100%,54rem)] overflow-x-hidden px-5 sm:px-6 md:px-8 lg:max-w-[min(100%,54rem)] lg:shrink-0 lg:basis-[min(100%,min(54rem,52vw))] lg:pl-11 xl:pl-16 2xl:pl-20 lg:pr-6 max-lg:max-h-none max-lg:overflow-y-visible lg:max-h-full lg:overflow-y-auto lg:overscroll-contain`
            : 'pointer-events-none max-h-0 overflow-hidden opacity-0 lg:max-w-0 lg:overflow-hidden'
        }`}
        style={focusIndex !== null ? { opacity: uiFade } : undefined}
        aria-hidden={focusIndex === null}
      >
        {copy && (
          <div
            className={`w-full max-w-full text-left ${
              focusIndex === 0 || focusIndex === 1
                ? 'mt-0 pt-0 sm:mt-2 sm:pt-2 lg:mt-4 lg:pt-3'
                : 'mt-6 pt-4 sm:mt-8 sm:pt-6 lg:mt-10 lg:pt-8'
            }`}
          >
            {focusIndex === 0 ? (
              <>
                <h3 className="text-lg font-semibold tracking-tight sm:text-xl md:text-2xl lg:text-3xl">
                  <span className="inline-block text-gradient-neon">Experiência</span>
                </h3>
                <div className="mt-5 sm:mt-6 lg:mt-8">
                  <ExperienceTimeline reveal />
                </div>
              </>
            ) : focusIndex === 1 ? (
              <div className="about-stack-icon-surface mt-0 w-full min-w-0 max-w-none">
                <TechIconsGrid spacious />
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
                  {focusIndex === 2 ? (
                    <span className="inline-block text-gradient-neon">{copy.title}</span>
                  ) : (
                    <span className="text-white [text-shadow:0_1px_18px_rgba(0,0,0,0.75)]">{copy.title}</span>
                  )}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-white/90 [text-shadow:0_1px_18px_rgba(0,0,0,0.75)] sm:mt-4 sm:text-lg lg:text-xl">
                  {copy.body}
                </p>
                {copy.body2 ? (
                  <p className="mt-3 text-base leading-relaxed text-white/90 [text-shadow:0_1px_18px_rgba(0,0,0,0.75)] sm:mt-4 sm:text-lg lg:text-xl">
                    {copy.body2}
                  </p>
                ) : null}
                {copy.body3 ? (
                  <p className="mt-3 text-base leading-relaxed text-white/90 [text-shadow:0_1px_18px_rgba(0,0,0,0.75)] sm:mt-4 sm:text-lg lg:text-xl">
                    {copy.body3}
                  </p>
                ) : null}
              </>
            )}
          </div>
        )}
      </aside>

      <div
        className={`relative min-h-0 w-full min-w-0 overflow-hidden ${
          focusIndex !== null
            ? 'lg:ml-0 lg:min-h-0 lg:min-w-[min(24rem,40vw)] lg:max-w-none lg:flex-1 lg:pl-1 xl:pl-2 lg:pr-0 xl:translate-x-4 2xl:translate-x-[min(3rem,4vw)]'
            : 'flex-1'
        } ${transitionPhase !== 'none' ? 'pointer-events-none' : ''} ${
          focusIndex !== null
            ? 'min-h-[min(36dvh,22rem)] h-[min(42dvh,calc(100dvh-13rem))] max-h-full flex-1 pb-0 sm:min-h-[min(38dvh,24rem)] sm:h-[min(44dvh,calc(100dvh-13.5rem))] lg:min-h-0 lg:h-full lg:max-h-none lg:pb-0'
            : 'h-[min(540px,72vmin)] sm:h-[580px]'
        } ${
          /* Mobile: fileira de planetas fica em AboutPlanetMobilePickers; esconde o canvas grande em modo foco. */
          focusIndex !== null ? 'max-md:hidden' : ''
        }`}
      >
        <Canvas
          camera={{ position: [0, 0.12, IDLE_CAMERA_Z], fov: FOV_DEFAULT, near: 0.1, far: 200 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          onCreated={({ gl, scene }) => {
            gl.setClearColor('#000000', 0);
            scene.background = null;
          }}
          className="touch-none [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full"
          style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <Scene
              focusIndex={focusIndex}
              transitionPhase={transitionPhase}
              fadeMulRef={fadeMulRef}
              uiFade={uiFade}
              onPlanetTap={onPlanetTap}
              onFadeOutComplete={handleFadeOutComplete}
              onFadeInComplete={handleFadeInComplete}
              onFadeMultiplier={onFadeMultiplier}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
