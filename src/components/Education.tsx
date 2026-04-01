import ScrollReveal from './ScrollReveal';
import SectionTitle from './SectionTitle';
import { GraduationCap, Award } from 'lucide-react';

const items = [
  { icon: GraduationCap, title: 'FAMETRO – Análise e Desenvolvimento de Sistemas', detail: 'Cursando · Conclusão 2026' },
  { icon: Award, title: 'SENAC AM – Desenvolvimento Full Stack', detail: 'Concluído · 2024' },
  { icon: Award, title: 'Delta Sollutions – Desafio Mobile', detail: 'Concluído · 2025' },
];

export default function Education() {
  return (
    <section
      id="education"
      className="section-soft-bg relative z-10 flex min-h-screen min-h-dvh flex-col py-32 px-6"
    >
      <div className="container max-w-3xl">
        <SectionTitle title="Formação" />

        <div className="space-y-4">
          {items.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 0.1}>
              <div className="glass rounded-xl p-6 flex items-start gap-4 neon-border group hover:glow-purple transition-shadow duration-300">
                <div className="p-2 rounded-lg bg-gradient-neon shrink-0">
                  <item.icon size={18} className="text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
