import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useSectionNav, type SectionId } from '@/lib/SectionNavContext';

const links: { label: string; id: SectionId }[] = [
  { label: 'Sobre', id: 'about' },
  { label: 'Projetos', id: 'projects' },
  { label: 'Contato', id: 'contact' },
];

export default function Navbar() {
  const { active, go } = useSectionNav();
  const [open, setOpen] = useState(false);

  const navigate = (id: SectionId) => {
    go(id);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 nav-glass-purple"
    >
      <div className="container relative flex h-16 items-center px-6">
        <div className="flex flex-1 justify-start">
          <button
            onClick={() => navigate('hero')}
            className="text-lg font-bold"
          >
            <span className="text-white">Y</span>
            <span className="text-gradient-neon">B</span>
          </button>
        </div>

        <nav
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex md:items-center md:gap-8"
          aria-label="Principal"
        >
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => navigate(l.id)}
              className={`text-sm transition-colors duration-200 ${
                active === l.id
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex flex-1 justify-end">
          <button
            onClick={() => setOpen(!open)}
            className="text-foreground md:hidden"
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="nav-glass-purple border-t border-white/[0.08] md:hidden"
          >
            <nav
              className="flex flex-col divide-y divide-white/[0.06] px-5 pb-5 pt-0.5 max-[380px]:px-4 [padding-left:max(1.25rem,env(safe-area-inset-left,0px))] [padding-right:max(1.25rem,env(safe-area-inset-right,0px))]"
              aria-label="Menu principal"
            >
              {links.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => navigate(l.id)}
                  className={`w-full py-3 text-right text-base font-medium tracking-normal transition-colors duration-200 first:pt-2 ${
                    active === l.id
                      ? ''
                      : 'text-muted-foreground hover:text-foreground active:text-foreground'
                  }`}
                >
                  {active === l.id ? (
                    <span className="text-gradient-neon font-semibold">{l.label}</span>
                  ) : (
                    l.label
                  )}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
