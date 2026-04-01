import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import type { PlanetFocusIndex } from '@/lib/aboutPlanetLayout';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
const About = lazy(() => import('@/components/About'));
import Projects from '@/components/Projects';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import { SectionNavProvider, useSectionNav, type SectionId } from '@/lib/SectionNavContext';

type NonAboutSectionId = Exclude<SectionId, 'about'>;

const sectionMap: Record<NonAboutSectionId, ComponentType> = {
  hero: Hero,
  projects: Projects,
  contact: Contact,
};

function ActiveSection({
  aboutPlanetFocus,
  onAboutPlanetFocusChange,
  /** Só com viewport fixa (planeta no desktop): o filho enche o main; caso contrário a secção cresce com o conteúdo e o body faz scroll (mobile Projetos, etc.). */
  fillMainForLockedAbout,
}: {
  aboutPlanetFocus: PlanetFocusIndex | null;
  onAboutPlanetFocusChange: (focus: PlanetFocusIndex | null) => void;
  fillMainForLockedAbout: boolean;
}) {
  const { active } = useSectionNav();
  const nonAboutActive = active !== 'about' ? (active as NonAboutSectionId) : null;
  const NonAboutComponent = nonAboutActive ? sectionMap[nonAboutActive] : null;

  /** Precarrega o chunk Sobre no Hero para transição mais suave. */
  useEffect(() => {
    if (active === 'hero') void import('@/components/About');
  }, [active]);

  return (
    <div
      className={cn(
        'relative flex w-full flex-col',
        /* shrink-0: o flex do main não encolhe esta coluna à altura da viewport (isso cortava o scroll em Projetos). */
        fillMainForLockedAbout ? 'min-h-0 shrink flex-1' : 'shrink-0',
      )}
    >
      {/*
        Montar About só com active === 'about'. Manter o About montado por baixo (absolute + opacity 0)
        bloqueava scroll/toque em vários browsers por causa do Canvas/WebGL e stacking.
      */}
      {active === 'about' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-[1] flex min-h-0 w-full flex-1 flex-col overflow-hidden max-lg:overflow-visible"
        >
          <Suspense fallback={<div className="min-h-[min(100dvh,900px)] w-full" aria-hidden />}>
            <About onPlanetFocusChange={onAboutPlanetFocusChange} />
          </Suspense>
          {aboutPlanetFocus === null && <Footer />}
        </motion.div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {nonAboutActive && NonAboutComponent && (
          <motion.div
            key={nonAboutActive}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-[2] w-full max-w-none shrink-0 overflow-visible"
            style={{ overflow: 'visible' }}
          >
            <NonAboutComponent />
            {nonAboutActive !== 'hero' && <Footer />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MainLayout() {
  const { active } = useSectionNav();
  const [aboutPlanetFocus, setAboutPlanetFocus] = useState<PlanetFocusIndex | null>(null);
  /** Só trava scroll da página no desktop (layout 2 colunas). No mobile, scroll da página inteira como no planeta Stack. */
  const [isLgUp, setIsLgUp] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsLgUp(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const lockViewport =
    active === 'about' &&
    aboutPlanetFocus !== null &&
    aboutPlanetFocus !== 1 &&
    isLgUp;

  useEffect(() => {
    if (active !== 'about') setAboutPlanetFocus(null);
  }, [active]);

  useEffect(() => {
    document.documentElement.classList.toggle('about-planet-focus', lockViewport);
    document.body.classList.toggle('about-planet-focus', lockViewport);
    return () => {
      document.documentElement.classList.remove('about-planet-focus');
      document.body.classList.remove('about-planet-focus');
    };
  }, [lockViewport]);

  return (
    <main
      className={cn(
        'relative flex w-full max-w-none flex-col overflow-visible bg-transparent cursor-auto md:cursor-none',
        lockViewport ? 'h-dvh min-h-0 max-h-dvh overflow-hidden' : 'min-h-screen',
      )}
    >
      <CustomCursor />
      <Navbar />
      <ActiveSection
        aboutPlanetFocus={aboutPlanetFocus}
        onAboutPlanetFocusChange={setAboutPlanetFocus}
        fillMainForLockedAbout={lockViewport}
      />
    </main>
  );
}

export default function Index() {
  return (
    <SectionNavProvider>
      <MainLayout />
    </SectionNavProvider>
  );
}
