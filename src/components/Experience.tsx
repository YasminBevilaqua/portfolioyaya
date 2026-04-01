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

      <div className="space-y-12">
        {jobs.map((job, i) => {
          const node = (
            <div className="relative pl-12">
              {/* Dot */}
              <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-neon-purple/40 glow-purple">
                <Briefcase size={14} className="text-neon-purple" />
              </div>

              <div className="experience-card-glass rounded-xl p-6 neon-border">
                <header className="mb-5">
                  <div className="flex flex-row items-start justify-between gap-4">
                    <div className="min-w-0 pr-2">
                      <h3 className="text-lg font-bold text-white tracking-tight">{job.role}</h3>
                      <p className="mt-1 text-sm italic text-foreground/75 leading-snug">
                        {job.company}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium tracking-wide shrink-0 pt-1 text-right">
                      {job.period}
                    </span>
                  </div>
                </header>

                <ul className="list-outside list-disc pl-5 space-y-2.5 marker:text-neon-pink">
                  {job.items.map((item) => (
                    <li key={item} className="text-sm text-white leading-relaxed pl-1">
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
