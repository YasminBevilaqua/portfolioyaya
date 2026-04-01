import * as THREE from 'three';

export type PlanetFocusIndex = 0 | 1 | 2;

/** Raios da esfera base (antes de scaleMul). Maiores que o design inicial (~+55%). */
const SIZE = 1.55;
export const PLANET_RADII = [0.75 * 1.4 * SIZE, 0.75 * 1.6 * SIZE, 0.75 * 2 * SIZE] as const;

const OP = 0.96;

/**
 * Raios em mundo **padronizados** para o par em segundo plano: o da **esquerda** (índice menor
 * entre os dois) é sempre mais pequeno; o da **direita** (índice maior) é sempre maior — em
 * qualquer foco (Experiência, Stack ou Quem Sou).
 */
/** Esquerda do par mais pequena; direita claramente maior (leitura estável em qualquer foco). */
const BG_PAIR_LEFT_WORLD_RADIUS = PLANET_RADII[1] * 0.94;
const BG_PAIR_RIGHT_WORLD_RADIUS = PLANET_RADII[1] * 1.34;

if (import.meta.env.DEV && BG_PAIR_LEFT_WORLD_RADIUS >= BG_PAIR_RIGHT_WORLD_RADIUS) {
  throw new Error('aboutPlanetLayout: BG_PAIR_LEFT_WORLD_RADIUS must be < BG_PAIR_RIGHT_WORLD_RADIUS');
}

/**
 * Raios em mundo dos dois planetas em segundo plano (modo foco).
 * **Invariante:** `left` &lt; `right` — o disco à direita da fila é sempre maior que o da esquerda.
 */
export function getFocusBackgroundPairWorldRadii(): { left: number; right: number } {
  return { left: BG_PAIR_LEFT_WORLD_RADIUS, right: BG_PAIR_RIGHT_WORLD_RADIUS };
}

/**
 * Os dois índices que não estão em foco, ordenados: `leftIndex` &lt; `rightIndex` em valor e em posição X
 * (o da esquerda no ecrã corresponde ao menor índice entre o par).
 */
export function getBackgroundPlanetsOrdered(focus: PlanetFocusIndex): {
  leftIndex: PlanetFocusIndex;
  rightIndex: PlanetFocusIndex;
} {
  const others = ([0, 1, 2] as const).filter((i) => i !== focus);
  others.sort((a, b) => a - b);
  const [lo, hi] = others as [PlanetFocusIndex, PlanetFocusIndex];
  return { leftIndex: lo, rightIndex: hi };
}

/** Raio em mundo do planeta em segundo plano: esquerda = menor disco, direita = maior disco. */
export function getBackgroundPlanetWorldRadius(
  focus: PlanetFocusIndex,
  planetIndex: PlanetFocusIndex,
): number | null {
  if (planetIndex === focus) return null;
  const { leftIndex, rightIndex } = getBackgroundPlanetsOrdered(focus);
  const { left, right } = getFocusBackgroundPairWorldRadii();
  if (planetIndex === leftIndex) return left;
  if (planetIndex === rightIndex) return right;
  return null;
}

function getUnfocusScaleMul(focus: PlanetFocusIndex, planetIndex: PlanetFocusIndex): number {
  const worldR = getBackgroundPlanetWorldRadius(focus, planetIndex);
  if (worldR === null) return getFocusScaleMul(planetIndex);
  return worldR / PLANET_RADII[planetIndex];
}

/**
 * Modo foco: planeta selecionado **sempre à direita** (grande); os outros dois **sempre à esquerda**,
 * lado a lado por ordem de índice (0 &lt; 1 &lt; 2), sem “rodar” a fila inteira consoante o foco.
 */
const FOCUS_ROW_Y = 0.11;
/** Z do planeta em foco (mais à frente na cena). Os dois em segundo plano recuam em Z para parecerem “em fila”. */
const FOCUS_ROW_Z = 0.92;
/** Recuo em Z (maior = mais “atrás” na fila em profundidade). */
const BG_Z_OFFSET_HI = 0.52;
const BG_Z_OFFSET_LO = 1.02;
/** Compensa perspetiva: o disco mais recuado tende a descer no ecrã; sobe-se ligeiramente o Y. */
const BG_Y_COMP_LO = 0.07;
const BG_Y_COMP_HI = 0.03;
/** Centro X do planeta em foco (à direita). */
const FOCUS_RIGHT_ANCHOR_X = 7.15;
/**
 * Multiplicador base quando o planeta em foco é o **Quem Sou** (índice 2, maior raio base).
 * Os outros índices usam `getFocusScaleMul(i)` para o **mesmo raio em mundo** quando selecionados.
 */
const FOCUS_SCALE_MUL = 7.1;

/** Raio em mundo do planeta focado (referência = Quem Sou ao tamanho atual). */
const FOCUS_WORLD_RADIUS_REF = PLANET_RADII[2] * FOCUS_SCALE_MUL;

function getFocusScaleMul(planetIndex: PlanetFocusIndex): number {
  return FOCUS_WORLD_RADIUS_REF / PLANET_RADII[planetIndex];
}
/** Folga entre superfícies dos dois planetas em segundo plano (espaço horizontal entre eles). */
const FOCUS_SURFACE_GAP = 0.78;
/** Folga entre o par e o planeta focado. */
const FOCUS_CLUSTER_TO_FOCUS_GAP = 1.2;
/** Desloca a fila em foco em +X (mundo), junto à zona direita do ecrã. */
const FOCUS_ROW_SHIFT_WORLD_X = 4.75;

/**
 * Desvio no ponto de mira: com `lookAt(centroDoPlaneta)`, esse ponto cai **sempre no centro do canvas** —
 * por isso mudar só posições no mundo / `FOCUS_CAMERA_POS_X` quase não desloca o cluster no ecrã.
 * Olhar para um ponto em X **ligeiramente menor** que o centro do planeta focado desloca o conjunto para a **direita** na viewport.
 */
/** Menor = ponto de mira mais à direita = cluster mais à esquerda no ecrã — evita corte no bordo direito sem overflow na página. */
export const FOCUS_LOOK_AT_BIAS_X = 7.85;

/** Modo idle: fila centrada em x = 0 — mira na origem para os 3 planetas ficarem centrados no canvas. */
export const IDLE_LOOK_AT_BIAS_X = 0;

function worldRadiusFocus(focus: PlanetFocusIndex, planetIndex: PlanetFocusIndex, isFocused: boolean): number {
  const mul = isFocused ? getFocusScaleMul(planetIndex) : getUnfocusScaleMul(focus, planetIndex);
  return PLANET_RADII[planetIndex] * mul;
}

function getFocusPlanetPosition(focus: PlanetFocusIndex, planetIndex: PlanetFocusIndex): THREE.Vector3 {
  const zFocus = FOCUS_ROW_Z;
  const g = FOCUS_SURFACE_GAP;

  if (planetIndex === focus) {
    return new THREE.Vector3(FOCUS_RIGHT_ANCHOR_X + FOCUS_ROW_SHIFT_WORLD_X, FOCUS_ROW_Y, zFocus);
  }

  const rF = worldRadiusFocus(focus, focus, true);
  const { leftIndex: lo, rightIndex: hi } = getBackgroundPlanetsOrdered(focus);

  const rLo = worldRadiusFocus(focus, lo, false);
  const rHi = worldRadiusFocus(focus, hi, false);

  const focusLeftSurface = FOCUS_RIGHT_ANCHOR_X - rF;
  const rightEdgeSmallCluster = focusLeftSurface - FOCUS_CLUSTER_TO_FOCUS_GAP;
  const xHi = rightEdgeSmallCluster - rHi;
  const xLo = xHi - rLo - g - rHi;

  const zHi = zFocus - BG_Z_OFFSET_HI;
  const zLo = zFocus - BG_Z_OFFSET_LO;
  const yHi = FOCUS_ROW_Y + BG_Y_COMP_HI;
  const yLo = FOCUS_ROW_Y + BG_Y_COMP_LO;

  if (planetIndex === lo) return new THREE.Vector3(xLo + FOCUS_ROW_SHIFT_WORLD_X, yLo, zLo);
  return new THREE.Vector3(xHi + FOCUS_ROW_SHIFT_WORLD_X, yHi, zHi);
}

/**
 * Metade da largura em X necessária no frustum quando a câmara olha para
 * `(planeta focado).x - FOCUS_LOOK_AT_BIAS_X` (não para o centro da esfera).
 */
function focusRowHalfSpanFromLookTarget(focus: PlanetFocusIndex): number {
  const xf = getFocusPlanetPosition(focus, focus).x;
  const lookX = xf - FOCUS_LOOK_AT_BIAS_X;
  let left = xf;
  let right = xf;
  for (const i of [0, 1, 2] as const) {
    const p = getFocusPlanetPosition(focus, i);
    const r = worldRadiusFocus(focus, i, focus === i);
    left = Math.min(left, p.x - r);
    right = Math.max(right, p.x + r);
  }
  return Math.max(lookX - left, right - lookX);
}

/**
 * FOV vertical em modo foco — **tem de ser o mesmo** que em `AboutPlanet` (`FOV_FOCUS`).
 * FOV mais baixo = zoom óptico (discos maiores no ecrã). O `getMinFocusCameraZForAspect` usa este valor
 * para que o Z mínimo corresponda ao frustum real e não haja cortes.
 */
export const FOCUS_MODE_VFOV = 40;

/**
 * Z mínima para a fila em modo foco caber no frustum (mesma ideia que idle).
 * `aspect` = largura/altura do canvas.
 */
export function getMinFocusCameraZForAspect(aspect: number, focus: PlanetFocusIndex): number {
  const halfSpan = focusRowHalfSpanFromLookTarget(focus);
  const tanHalf = Math.tan(((FOCUS_MODE_VFOV * Math.PI) / 180) / 2);
  /** Folga no frustum (viewport WebGL contida — sem scroll horizontal na página). */
  const margin = 1.34;
  const a = Math.max(aspect, 0.08);
  return (halfSpan * margin) / (tanHalf * a);
}

/** Vista inicial: escala comum + boost (esquerda menor, direita maior). */
const IDLE_SCALE_BASE = 2.58;
const IDLE_SCALE_BOOST: Record<PlanetFocusIndex, number> = {
  0: 1.34,
  1: 1.62,
  2: 1.98,
};

/** Folga entre superfícies vizinhas (unidades de mundo). */
const IDLE_SURFACE_GAP = 1.28;

function idlePlanetWorldRadius(planetIndex: PlanetFocusIndex): number {
  return PLANET_RADII[planetIndex] * IDLE_SCALE_BASE * IDLE_SCALE_BOOST[planetIndex];
}

/**
 * Experiência → Stack → Quem Sou, com **centros no mesmo Y = 0** e fila **centrada em x = 0**
 * (meio entre bordo esq. do 0 e bordo dir. do 2).
 */
function idlePlanetX(planetIndex: PlanetFocusIndex): number {
  const r0 = idlePlanetWorldRadius(0);
  const r1 = idlePlanetWorldRadius(1);
  const r2 = idlePlanetWorldRadius(2);
  const G = IDLE_SURFACE_GAP;
  const cx0 = -(r0 + r1 + G);
  const cx1 = 0;
  const cx2 = r1 + r2 + G;
  const leftEdge = cx0 - r0;
  const rightEdge = cx2 + r2;
  const offset = (leftEdge + rightEdge) / 2;
  if (planetIndex === 0) return cx0 - offset;
  if (planetIndex === 1) return cx1 - offset;
  return cx2 - offset;
}

/**
 * Z mínima na vista inicial para a fileira não cortar no frustum (FOV vertical fixo em AboutPlanet).
 * halfWidth ≈ dist * tan(vfov/2) * aspect → dist >= halfSpan / (tan(vfov/2) * aspect)
 */
const IDLE_CAMERA_VFOV = 45;

/** Metade da largura da fileira no plano x relativamente ao ponto de mira idle (−IDLE_LOOK_AT_BIAS_X; 0 = origem). */
function idleRowHalfSpanFromLookTarget(): number {
  const lookX = -IDLE_LOOK_AT_BIAS_X;
  let left = Infinity;
  let right = -Infinity;
  for (const i of [0, 1, 2] as const) {
    const x = idlePlanetX(i);
    const r = idlePlanetWorldRadius(i);
    left = Math.min(left, x - r);
    right = Math.max(right, x + r);
  }
  return Math.max(lookX - left, right - lookX);
}

/** `aspect` = largura/altura do canvas; ecrãs mais estreitos precisam de Z maior. */
export function getMinIdleCameraZForAspect(aspect: number): number {
  const halfSpan = idleRowHalfSpanFromLookTarget();
  const tanHalf = Math.tan(((IDLE_CAMERA_VFOV * Math.PI) / 180) / 2);
  const margin = 1.28;
  const a = Math.max(aspect, 0.08);
  return (halfSpan * margin) / (tanHalf * a);
}

/** Valor inicial do Canvas (desktop ~16:10). */
export const IDLE_CAMERA_Z = getMinIdleCameraZForAspect(1.62);

/**
 * Layout explícito por (foco, índice) — evita planetas fora do frustum ou sobrepostos.
 * Câmara em perspetiva ~ (0, 0.4, 11–14) olhando para a origem.
 */
export function getPlanetLayout(
  focus: PlanetFocusIndex | null,
  planetIndex: PlanetFocusIndex,
): { position: THREE.Vector3; scaleMul: number; opacity: number } {
  if (focus === null) {
    return {
      position: new THREE.Vector3(idlePlanetX(planetIndex), 0, 0),
      scaleMul: IDLE_SCALE_BASE * IDLE_SCALE_BOOST[planetIndex],
      opacity: 1,
    };
  }

  if (focus === planetIndex) {
    return {
      position: getFocusPlanetPosition(focus, planetIndex),
      scaleMul: getFocusScaleMul(planetIndex),
      opacity: 1,
    };
  }

  return {
    position: getFocusPlanetPosition(focus, planetIndex),
    scaleMul: getUnfocusScaleMul(focus, planetIndex),
    opacity: OP,
  };
}

/** Câmara ligeiramente em −X (mundo): o frustum desloca-se para a direita no ecrã (cluster junto ao canto direito). */
const FOCUS_CAMERA_POS_X = -3.85;

/** Eixo X = 0 com a fila centrada em x = 0 — enquadramento simétrico no canvas. */
const IDLE_CAMERA_POS_X = 0;

export function getCameraTarget(focus: PlanetFocusIndex | null): THREE.Vector3 {
  if (focus === null) {
    /** Y baixo para a linha dos centros (y = 0) parecer mais horizontal no ecrã. */
    return new THREE.Vector3(IDLE_CAMERA_POS_X, 0.12, IDLE_CAMERA_Z);
  }
  /** Z mais baixo = planetas maiores no ecrã; `max` com minZ por aspect evita cortes. */
  return new THREE.Vector3(FOCUS_CAMERA_POS_X, 0.38, 14.25);
}
