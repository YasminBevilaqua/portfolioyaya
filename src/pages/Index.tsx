import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
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
import type { PlanetFocusIndex } from '@/lib/aboutPlanetLayout';

type NonAboutSectionId = Exclude<SectionId, 'about'>;

const sectionMap: Record<NonAboutSectionId, ComponentType> = {
  hero: Hero,
  projects: Projects,
  contact: Contact,
};

function ActiveSection({
  aboutPlanetFocus,
  onAboutPlanetFocusChange,
}: {
  aboutPlanetFocus: PlanetFocusIndex | null;
  onAboutPlanetFocusChange: (focus: PlanetFocusIndex | null) => void;
}) {
  const { active } = useSectionNav();
  const [aboutMounted, setAboutMounted] = useState(active === 'about');
  const nonAboutActive = active !== 'about' ? (active as NonAboutSectionId) : null;
  const NonAboutComponent = nonAboutActive ? sectionMap[nonAboutActive] : null;

  useEffect(() => {
    if (active === 'about') setAboutMounted(true);
  }, [active]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {aboutMounted && (
        <motion.div
          initial={false}
          animate={{ opacity: active === 'about' ? 1 : 0, y: active === 'about' ? 0 : 6 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={
            active === 'about'
              ? 'relative flex min-h-0 flex-1 flex-col overflow-hidden max-lg:overflow-visible'
              : 'pointer-events-none absolute inset-0 overflow-hidden'
          }
          aria-hidden={active !== 'about'}
        >
          <Suspense fallback={<div className="min-h-[min(100dvh,900px)] w-full" aria-hidden />}>
            <About onPlanetFocusChange={onAboutPlanetFocusChange} />
          </Suspense>
          {active === 'about' && aboutPlanetFocus === null && <Footer />}
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
            className="relative"
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
        'relative flex flex-col overflow-x-hidden bg-transparent cursor-auto md:cursor-none',
        lockViewport ? 'h-dvh min-h-0 max-h-dvh overflow-y-hidden' : 'min-h-screen',
      )}
    >
      <CustomCursor />
      <Navbar />
      <ActiveSection
        aboutPlanetFocus={aboutPlanetFocus}
        onAboutPlanetFocusChange={setAboutPlanetFocus}
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
