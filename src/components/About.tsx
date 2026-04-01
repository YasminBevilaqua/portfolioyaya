import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import ScrollReveal from './ScrollReveal';
import SectionTitle from './SectionTitle';
import AboutPlanet from './AboutPlanet';
import AboutPlanetMobilePickers from './AboutPlanetMobilePickers';
import type { PlanetFocusIndex } from '@/lib/aboutPlanetLayout';

type AboutProps = {
  onPlanetFocusChange?: (focus: PlanetFocusIndex | null) => void;
};

export default function About({ onPlanetFocusChange }: AboutProps) {
  const [planetFocus, setPlanetFocus] = useState<PlanetFocusIndex | null>(null);

  useEffect(() => {
    onPlanetFocusChange?.(planetFocus);
  }, [planetFocus, onPlanetFocusChange]);

  return (
    <section
      id="about"
      className={cn(
        'section-soft-bg relative isolate z-10 flex flex-col items-center overflow-x-hidden px-4 sm:px-6',
        planetFocus !== null
          ? planetFocus === 1
            ? 'min-h-screen min-h-dvh justify-start overflow-visible pt-[calc(4rem+1.25rem)] pb-24'
            : 'h-full min-h-0 flex-1 justify-start overflow-hidden pt-[calc(4rem+1.25rem)] pb-0'
          : 'section-padding-top min-h-screen min-h-dvh justify-start pb-24',
        planetFocus === 2 ? 'about--blob-eu-sou' : '',
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="about-blob about-blob--left" />
      </div>

      <div
        className={cn(
          'relative z-[1] flex w-full min-h-0 flex-1 flex-col items-center justify-start',
          planetFocus !== null
            ? `max-w-none ${planetFocus === 1 ? 'overflow-visible' : 'overflow-hidden'}`
            : '',
        )}
      >
        <div
          className={cn(
            'mx-auto w-full max-w-4xl shrink-0 px-1',
            planetFocus !== null &&
              'max-md:[&>div]:!mb-4 md:[&>div]:!mb-16',
          )}
        >
          <SectionTitle>
            <span className="text-white">Sobre </span>
            <span className="text-gradient-neon">Mim</span>
          </SectionTitle>
        </div>

        {planetFocus !== null && (
          <AboutPlanetMobilePickers focusIndex={planetFocus} onSelectPlanet={setPlanetFocus} />
        )}

        <ScrollReveal
          fadeOnly
          className={cn(
            'pointer-events-auto mt-6 w-full sm:mt-8 md:mt-10',
            planetFocus !== null
              ? `mt-4 flex min-h-0 flex-1 flex-col sm:mt-5 ${
                  planetFocus === 1 ? 'overflow-visible' : 'overflow-hidden'
                }`
              : 'sm:mt-12 md:mt-14',
          )}
        >
          <AboutPlanet focusIndex={planetFocus} onFocusChange={setPlanetFocus} />
        </ScrollReveal>
      </div>
    </section>
  );
}
