import { motion } from 'framer-motion';
import { useSectionNav } from '@/lib/SectionNavContext';

export default function Hero() {
  const { go } = useSectionNav();
  return (
    <section
      id="hero"
      className="relative z-10 flex min-h-screen items-center justify-start overflow-hidden md:justify-center"
    >
      <div className="relative z-10 flex min-h-0 w-full items-start justify-start px-6 pb-16 pt-24 md:min-h-screen md:items-center md:justify-center md:px-12 md:pb-0 md:pt-0">
        <div className="flex min-w-0 max-w-3xl flex-col text-left md:text-center">
          <motion.p
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 mb-0 mt-3 max-w-xl text-xs font-medium uppercase tracking-[0.2em] text-foreground/75 md:order-1 md:mb-4 md:mt-0 md:text-sm md:font-semibold md:tracking-[0.3em] md:text-foreground/82"
          >
            Desenvolvedora Front-End
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.9, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="order-1 text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl md:order-2 md:text-7xl"
          >
            <span className="block md:inline">Yasmin</span>
            <span className="hidden md:inline">{' '}</span>
            <span className="block text-gradient-neon md:inline">Beviláqua</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.7, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="order-3 mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground md:mt-6 md:text-lg"
          >
            Transformando ideias em interfaces reais!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="hero-cta-group order-4 mt-8 flex flex-wrap gap-4 md:mt-10 md:justify-center"
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
