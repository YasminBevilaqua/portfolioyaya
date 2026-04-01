import { motion } from 'framer-motion';
import { useSectionNav } from '@/lib/SectionNavContext';

export default function Hero() {
  const { go } = useSectionNav();
  return (
    <section id="hero" className="relative z-10 flex min-h-screen items-center justify-center overflow-hidden">
      <div className="relative z-10 flex min-h-0 w-full items-center justify-center px-6 pb-16 pt-24 md:min-h-screen md:px-12 md:pb-0 md:pt-0">
        <div className="min-w-0 max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-foreground/82"
          >
            Desenvolvedora Front-End
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.9, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl"
          >
            Yasmin{' '}
            <span className="text-gradient-neon">Beviláqua</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.7, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Criando experiências digitais imersivas e inesquecíveis.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="hero-cta-group mt-10 flex flex-wrap justify-center gap-4"
          >
            <button
              onClick={() => go('projects')}
              className="btn-glow-neon btn-glow-neon--projects bg-gradient-neon px-8 py-3 text-sm font-semibold text-primary-foreground hover:scale-[1.03]"
            >
              <span className="relative z-10">Ver Projetos</span>
            </button>
            <button
              onClick={() => go('contact')}
              className="btn-glow-neon-ghost px-8 py-3 text-sm font-semibold hover:scale-[1.03]"
            >
              <span className="relative z-10">Contato</span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
