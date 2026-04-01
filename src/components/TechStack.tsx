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

function useGridCols(): number {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const sync = () => {
      const w = window.innerWidth;
      if (w >= 768) setCols(4);
      else if (w >= 640) setCols(3);
      else setCols(2);
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);
  return cols;
}

function dockTranslateX(index: number, hovered: number | null, cols: number): number {
  if (hovered === null) return 0;
  if (index === hovered) return 0;

  if (index >= 8 && hovered >= 8) {
    return index < hovered ? -DOCK_SHIFT_PX : DOCK_SHIFT_PX;
  }
  if (hovered >= 8 && index < 8) return 0;
  if (index >= 8 && hovered < 8) return 0;

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
}: {
  t: (typeof techIcons)[number];
  index: number;
  cols: number;
  hoveredIndex: number | null;
  onEnter: (i: number) => void;
  spacious?: boolean;
}) {
  const tx = dockTranslateX(index, hoveredIndex, cols);
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

const techIconsFirstRows = techIcons.slice(0, 8);
const techIconsLastRow = techIcons.slice(8);
const assetsBase = `${import.meta.env.BASE_URL}images/`;

export function TechIconsGrid({ spacious = false }: { spacious?: boolean } = {}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const cols = useGridCols();

  const onEnter = useCallback((i: number) => setHoveredIndex(i), []);

  const onLeaveGrid = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    setHoveredIndex(null);
  }, []);

  const gapClass = spacious
    ? 'gap-y-12 gap-x-5 sm:gap-x-6 md:gap-x-7 lg:gap-x-8'
    : 'gap-y-12 gap-x-4';
  const lastRowGap = spacious ? 'gap-x-6 gap-y-12 sm:gap-x-7 md:gap-x-8' : 'gap-x-4 gap-y-12';
  const gridPadding = spacious ? 'px-2 py-5 sm:px-3 md:px-4' : 'py-2';

  return (
    <div
      className={`tech-icon-grid grid grid-cols-2 overflow-visible pb-16 sm:grid-cols-3 md:grid-cols-4 ${gapClass} ${gridPadding} ${spacious ? 'tech-icon-grid--spacious' : ''}`}
      onMouseLeave={onLeaveGrid}
    >
      {techIconsFirstRows.map((t, i) => (
        <TechIconCell
          key={t.file}
          t={t}
          index={i}
          cols={cols}
          hoveredIndex={hoveredIndex}
          onEnter={onEnter}
          spacious={spacious}
        />
      ))}
      <div className={`col-span-2 flex flex-wrap justify-center sm:col-span-3 md:col-span-4 ${lastRowGap}`}>
        {techIconsLastRow.map((t, i) => (
          <TechIconCell
            key={t.file}
            t={t}
            index={8 + i}
            cols={cols}
            hoveredIndex={hoveredIndex}
            onEnter={onEnter}
            spacious={spacious}
          />
        ))}
      </div>
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
