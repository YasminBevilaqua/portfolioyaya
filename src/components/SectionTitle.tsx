import type { ReactNode } from 'react';
import ScrollReveal from './ScrollReveal';

export default function SectionTitle({
  title,
  subtitle,
  subtitleClassName,
  children,
  align = 'center',
  /** Centro no mobile, alinhamento à esquerda a partir de md (ex.: Contato). */
  responsiveAlign = false,
}: {
  title?: string;
  subtitle?: string;
  subtitleClassName?: string;
  children?: ReactNode;
  align?: 'center' | 'left';
  responsiveAlign?: boolean;
}) {
  const heading =
    children ?? <span className="text-white">{title}</span>;

  const scrollClass = responsiveAlign
    ? 'mb-12 flex w-full flex-col items-center text-center md:mb-16 md:block md:items-start md:text-left'
    : align === 'left'
      ? 'mb-12 text-left md:mb-16'
      : 'mb-16 text-center';

  const subtitleClass =
    responsiveAlign
      ? `mt-4 text-gradient-neon max-w-2xl mx-auto md:mx-0 text-lg font-semibold leading-snug ${subtitleClassName ?? ''}`
      : align === 'center'
        ? `mt-4 text-gradient-neon max-w-2xl mx-auto text-lg font-semibold leading-snug ${subtitleClassName ?? ''}`
        : `mt-4 text-gradient-neon max-w-2xl text-lg font-semibold leading-snug ${subtitleClassName ?? ''}`;

  return (
    <ScrollReveal className={scrollClass}>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        {heading}
      </h2>
      {subtitle && <p className={subtitleClass}>{subtitle}</p>}
    </ScrollReveal>
  );
}
