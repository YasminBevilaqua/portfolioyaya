import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';
import ScrollReveal from './ScrollReveal';
import SectionTitle from './SectionTitle';

const techIcons: { name: string; file: string; color: string }[] = [
  { name: 'HTML', file: 'html.png', color: '#E34F26' },
  { name: 'CSS', file: 'css.png', color: '#1572B6' },
  { name: 'JavaScript', file: 'javascript.png', color: '#F7DF1E' },
  { name: 'TypeScript', file: 'typescript.png', color: '#3178C6' },
  { name: 'React', file: 'react.png', color: '#61DAFB' },
  { name: 'React Native', file: 'react native.png', color: '#61DAFB' },
  { name: 'Tailwind CSS', file: 'tailwind.png', color: '#ffffff' },
  { name: 'Three.js', file: 'three.js.png', color: '#8B5CF6' },
  { name: 'Vite', file: 'vite.png', color: '#646CFF' },
  { name: 'Vue.js', file: 'vue.js.png', color: '#42B883' },
  { name: 'Python', file: 'python.png', color: '#3776AB' },
];

const DOCK_SHIFT_PX = 14;
const DOCK_SCALE = 1.14;

function useGridCols(spacious: boolean): number {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const sync = () => {
      const w = window.innerWidth;
      if (w >= 768) setCols(4);
      else if (w >= 640) setCols(3);
      else setCols(spacious ? 3 : 2);
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [spacious]);
  return cols;
}

/** Desktop: últimos 3 ícones num flex — dock só entre eles. Mobile (grade única): dock por linha da grid. */
function dockTranslateX(
  index: number,
  hovered: number | null,
  cols: number,
  splitLastRow: boolean,
): number {
  if (hovered === null) return 0;
  if (index === hovered) return 0;

  if (splitLastRow) {
    if (index >= 8 && hovered >= 8) {
      return index < hovered ? -DOCK_SHIFT_PX : DOCK_SHIFT_PX;
    }
    if (hovered >= 8 && index < 8) return 0;
    if (index >= 8 && hovered < 8) return 0;
  }

  const rowH = Math.floor(hovered / cols);
  const rowI = Math.floor(index / cols);
  if (rowH !== rowI) return 0;
  return index < hovered ? -DOCK_SHIFT_PX : DOCK_SHIFT_PX;
}

function dockScale(index: number, hovered: number | null): number {
  if (hovered === null) return 1;
  return index === hovered ? DOCK_SCALE : 1;
}

function TechIconCell({
  t,
  index,
  cols,
  hoveredIndex,
  onEnter,
  spacious = false,
  splitLastRow,
}: {
  t: (typeof techIcons)[number];
  index: number;
  cols: number;
  hoveredIndex: number | null;
  onEnter: (i: number) => void;
  spacious?: boolean;
  splitLastRow: boolean;
}) {
  const tx = dockTranslateX(index, hoveredIndex, cols, splitLastRow);
  const scale = dockScale(index, hoveredIndex);
  const active = hoveredIndex === index;

  return (
    <ScrollReveal delay={index * 0.05} fadeOnly className="overflow-visible">
      <div
        className={`flex justify-center overflow-visible will-change-transform ${spacious ? 'tech-icon-cell' : 'pt-1'}`}
        style={{
          transform: `translateX(${tx}px) scale(${scale})`,
          transition: 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          zIndex: active ? 3 : 1,
        }}
        onMouseEnter={() => onEnter(index)}
      >
        <a
          href="#tech"
          className={`tech-icon-link ${active ? 'tech-icon-link--active' : ''}`}
          style={{ '--color': t.color } as CSSProperties}
          aria-label={t.name}
          onClick={(e) => e.preventDefault()}
        >
          <span className="tech-icon-stack">
            <img
              className="tech-icon-img"
              src={`${assetsBase}${encodeURIComponent(t.file)}`}
              alt={t.name}
              draggable={false}
            />
            <img
              className="tech-icon-reflect"
              src={`${assetsBase}${encodeURIComponent(t.file)}`}
              alt=""
              aria-hidden
              draggable={false}
            />
          </span>
        </a>
      </div>
    </ScrollReveal>
  );
}

const assetsBase = `${import.meta.env.BASE_URL}images/`;

const techIconsFirstRows = techIcons.slice(0, 8);
const techIconsLastRow = techIcons.slice(8);
/** Mobile 3 col: 9 ícones em 3×3; Vue + Python numa linha centralizada abaixo. */
const techIconsMobileUnifiedHead = techIcons.slice(0, 9);
const techIconsMobileUnifiedTail = techIcons.slice(9);

/** Alinhado ao Tailwind `max-sm` (639px): grade única no mobile; a partir de `sm` layout web anterior (8 + flex). */
function useIsMaxSm() {
  const [isMaxSm, setIsMaxSm] = useState(() =>
    typeof globalThis.window !== 'undefined'
      ? globalThis.window.matchMedia('(max-width: 639px)').matches
      : false,
  );
  useEffect(() => {
    const mq = globalThis.window.matchMedia('(max-width: 639px)');
    const sync = () => setIsMaxSm(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return isMaxSm;
}

export function TechIconsGrid({ spacious = false }: { spacious?: boolean } = {}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const cols = useGridCols(spacious);
  const isMaxSm = useIsMaxSm();
  const splitLastRow = !isMaxSm;

  const onEnter = useCallback((i: number) => setHoveredIndex(i), []);

  const onLeaveGrid = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    setHoveredIndex(null);
  }, []);

  const gapClass = spacious
    ? isMaxSm
      ? 'gap-y-9 gap-x-2.5 sm:gap-y-12 sm:gap-x-6 md:gap-x-7 lg:gap-x-8'
      : 'gap-y-12 gap-x-5 sm:gap-x-6 md:gap-x-7 lg:gap-x-8'
    : 'gap-y-12 gap-x-4';
  const lastRowGap = spacious
    ? 'gap-x-6 gap-y-12 sm:gap-x-7 md:gap-x-8'
    : 'gap-x-4 gap-y-12';
  const gridPadding = spacious
    ? isMaxSm
      ? 'px-1.5 py-5 sm:px-3 md:px-4'
      : 'px-2 py-5 sm:px-3 md:px-4'
    : 'py-2';
  const gridColsClass = spacious
    ? 'grid-cols-3 sm:grid-cols-3 md:grid-cols-4'
    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
  const lastRowSpanClass = spacious
    ? 'col-span-3 sm:col-span-3 md:col-span-4'
    : 'col-span-2 sm:col-span-3 md:col-span-4';

  return (
    <div
      className={`tech-icon-grid grid ${gridColsClass} overflow-visible pb-16 ${gapClass} ${gridPadding} ${spacious ? 'tech-icon-grid--spacious' : ''}`}
      onMouseLeave={onLeaveGrid}
    >
      {isMaxSm ? (
        spacious ? (
          <>
            {techIconsMobileUnifiedHead.map((t, i) => (
              <TechIconCell
                key={t.file}
                t={t}
                index={i}
                cols={cols}
                hoveredIndex={hoveredIndex}
                onEnter={onEnter}
                spacious={spacious}
                splitLastRow={false}
              />
            ))}
            <div className="col-span-3 flex flex-wrap justify-center gap-x-8 gap-y-9">
              {techIconsMobileUnifiedTail.map((t, i) => (
                <TechIconCell
                  key={t.file}
                  t={t}
                  index={9 + i}
                  cols={cols}
                  hoveredIndex={hoveredIndex}
                  onEnter={onEnter}
                  spacious={spacious}
                  splitLastRow={false}
                />
              ))}
            </div>
          </>
        ) : (
          techIcons.map((t, i) => (
            <TechIconCell
              key={t.file}
              t={t}
              index={i}
              cols={cols}
              hoveredIndex={hoveredIndex}
              onEnter={onEnter}
              spacious={spacious}
              splitLastRow={false}
            />
          ))
        )
      ) : (
        <>
          {techIconsFirstRows.map((t, i) => (
            <TechIconCell
              key={t.file}
              t={t}
              index={i}
              cols={cols}
              hoveredIndex={hoveredIndex}
              onEnter={onEnter}
              spacious={spacious}
              splitLastRow
            />
          ))}
          <div className={`${lastRowSpanClass} flex flex-wrap justify-center ${lastRowGap}`}>
            {techIconsLastRow.map((t, i) => (
              <TechIconCell
                key={t.file}
                t={t}
                index={8 + i}
                cols={cols}
                hoveredIndex={hoveredIndex}
                onEnter={onEnter}
                spacious={spacious}
                splitLastRow
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function TechStack() {
  return (
    <section
      id="tech"
      className="section-soft-bg section-padding-top relative z-10 flex min-h-screen min-h-dvh flex-col overflow-visible pb-32 px-6"
    >
      <div className="container max-w-4xl overflow-visible">
        <SectionTitle title="Tecnologias" subtitle="Ferramentas do dia a dia" />
        <TechIconsGrid />
      </div>
    </section>
  );
}
