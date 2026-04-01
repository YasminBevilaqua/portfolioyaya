import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
  /** Só opacidade — sem transform/filter no pai (necessário p.ex. para -webkit-box-reflect nos filhos). */
  fadeOnly?: boolean;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  fadeOnly = false,
}: Props) {
  const dirs = { up: { y: 20, x: 0 }, left: { x: -30, y: 0 }, right: { x: 30, y: 0 } };
  const d = dirs[direction];

  if (fadeOnly) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...d, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
