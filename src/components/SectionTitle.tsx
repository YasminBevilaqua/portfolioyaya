import type { ReactNode } from 'react';
import ScrollReveal from './ScrollReveal';

export default function SectionTitle({
  title,
  subtitle,
  subtitleClassName,
  children,
  align = 'center',
}: {
  title?: string;
  subtitle?: string;
  subtitleClassName?: string;
  children?: ReactNode;
  align?: 'center' | 'left';
}) {
  const heading =
    children ?? <span className="text-white">{title}</span>;

  return (
    <ScrollReveal
      className={
        align === 'left' ? 'mb-12 text-left md:mb-16' : 'mb-16 text-center'
      }
    >
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        {heading}
      </h2>
      {subtitle && (
        <p
          className={
            align === 'center'
              ? `mt-4 text-gradient-neon max-w-2xl mx-auto text-lg font-semibold leading-snug ${subtitleClassName ?? ''}`
              : `mt-4 text-gradient-neon max-w-2xl text-lg font-semibold leading-snug ${subtitleClassName ?? ''}`
          }
        >
          {subtitle}
        </p>
      )}
    </ScrollReveal>
  );
}
