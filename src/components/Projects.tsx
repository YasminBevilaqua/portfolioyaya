import ScrollReveal from './ScrollReveal';
import SectionTitle from './SectionTitle';
import { motion } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';

type ProjectCard = {
  title: string;
  description: string;
  stack: string[];
  liveUrl?: string;
  githubUrl?: string;
};

const projects: ProjectCard[] = [
  {
    title: 'NebulaMind',
    description:
      'Chat com IA que transforma conversas em experiencia: respostas naturais, interface imersiva e fluxo pensado para engajar do primeiro prompt ao insight final.',
    stack: ['Vite', 'React', 'TypeScript', 'Tailwind', 'shadcn/ui', 'Groq', 'Three.js'],
    liveUrl: 'https://nebulamind-ai.vercel.app/',
  },
  {
    title: 'App Delta Mobile',
    description: 'Aplicação mobile com integração de hardware serial e recursos de IA para automação industrial.',
    stack: ['React Native', 'Expo', 'TypeScript', 'REST APIs'],
  },
  {
    title: 'Dashboard Analytics',
    description: 'Painel de visualização de dados com gráficos interativos e atualizações em tempo real.',
    stack: ['React', 'Tailwind CSS', 'Recharts', 'Supabase'],
  },
];

export default function Projects() {
  return (
    <section
      id="projects"
      className="section-soft-bg section-padding-top relative z-10 flex min-h-screen min-h-dvh flex-col pb-32 px-6"
    >
      <div className="container max-w-5xl">
        <SectionTitle title="Projetos" subtitle="Trabalhos em destaque" />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -6 }}
                className={`glass rounded-2xl overflow-hidden neon-border group h-full flex flex-col ${p.liveUrl ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (p.liveUrl) window.open(p.liveUrl, '_blank', 'noopener,noreferrer');
                }}
                onKeyDown={e => {
                  if (!p.liveUrl) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.open(p.liveUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                role={p.liveUrl ? 'link' : undefined}
                tabIndex={p.liveUrl ? 0 : -1}
              >
                {/* Gradient placeholder top */}
                <div className="h-40 bg-gradient-to-br from-neon-purple/20 via-neon-pink/10 to-neon-orange/20 flex items-center justify-center">
                  <span className="text-3xl font-bold text-foreground/10 group-hover:text-foreground/20 transition-colors">
                    {p.title[0]}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{p.description}</p>

                  <div className="flex flex-wrap gap-2 mb-5">
                    {p.stack.map(s => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">{s}</span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {p.liveUrl ? (
                      <a
                        href={p.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink size={14} /> Ver Projeto
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground/50 cursor-default">
                        <ExternalLink size={14} /> Ver Projeto
                      </span>
                    )}
                    {p.githubUrl ? (
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Github size={14} /> GitHub
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground/50 cursor-default">
                        <Github size={14} /> GitHub
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
