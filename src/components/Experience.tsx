import ScrollReveal from './ScrollReveal';
import { Briefcase } from 'lucide-react';

const jobs = [
  {
    role: 'Desenvolvedora de Software',
    company: 'Delta Sollutions',
    period: '2025 – Atual',
    items: [
      'Front-End com React e Next.js',
      'Integração com APIs REST',
      'React Native + Expo',
      'Integração com hardware (serial)',
      'Implementação de IA',
      'Foco em performance e escalabilidade',
    ],
  },
  {
    role: 'Desenvolvedora Web / Web Designer',
    company: 'SASI Brasil – Projeto SEDUC Amazonas',
    period: '2024 – 2025',
    items: [
      'React, Next.js, HTML, CSS, JavaScript',
      'Interfaces responsivas',
      'Integração com APIs (FastAPI)',
      'React Native',
    ],
  },
];

export function ExperienceTimeline({ reveal = true }: { reveal?: boolean } = {}) {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-neon-purple via-neon-pink to-transparent" />

      <div className="space-y-6 md:space-y-12">
        {jobs.map((job, i) => {
          const node = (
            <div className="relative pl-9 md:pl-12">
              {/* Dot */}
              <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-neon-purple/40 bg-secondary glow-purple md:h-8 md:w-8">
                <Briefcase className="h-2.5 w-2.5 shrink-0 text-neon-purple md:h-3.5 md:w-3.5" />
              </div>

              <div className="experience-card-glass neon-border rounded-lg p-3 md:rounded-xl md:p-6">
                <header className="mb-2.5 md:mb-5">
                  <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-4">
                    <div className="min-w-0 md:pr-2">
                      <h3 className="text-sm font-bold tracking-tight text-white md:text-base lg:text-lg">{job.role}</h3>
                      <p className="mt-0.5 text-[11px] italic leading-snug text-foreground/75 md:mt-1 md:text-sm">
                        {job.company}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium tracking-wide text-muted-foreground md:pt-1 md:text-right md:text-xs">
                      {job.period}
                    </span>
                  </div>
                </header>

                <ul className="list-outside list-disc space-y-1 pl-3 marker:text-neon-pink md:space-y-2.5 md:pl-5">
                  {job.items.map((item) => (
                    <li key={item} className="pl-0.5 text-[11px] leading-relaxed text-white md:pl-1 md:text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );

          if (!reveal) return <div key={job.company}>{node}</div>;
          return (
            <ScrollReveal key={job.company} delay={i * 0.15}>
              {node}
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}

export default function Experience() {
  return (
    <section
      id="experience"
      className="section-soft-bg section-padding-top relative z-10 flex min-h-screen min-h-dvh flex-col pb-32 px-6"
    >
      <div className="container max-w-3xl">
        {/* Mantém seção para uso caso ainda exista rota; o conteúdo principal é reutilizável */}
        <div className="mb-10">
          <div className="mb-4 text-left">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-white">
              Experiência
            </h2>
            <p className="mt-3 text-gradient-neon text-lg font-semibold leading-snug">
              Minha trajetória profissional
            </p>
          </div>
        </div>

        <ExperienceTimeline reveal />
      </div>
    </section>
  );
}
