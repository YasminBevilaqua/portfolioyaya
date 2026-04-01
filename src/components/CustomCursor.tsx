import { useEffect, useRef, useState } from 'react';

const INTERACTIVE =
  'a, button, [role="button"], input, textarea, select, [data-cursor-hover]';

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const hoveringRef = useRef(false);

  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    setVisible(true);

    const onMove = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      const wrap = wrapRef.current;
      if (wrap) {
        wrap.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }

      const under = document.elementFromPoint(x, y);
      const next = !!under?.closest(INTERACTIVE);
      if (next === hoveringRef.current) return;
      hoveringRef.current = next;
      const ring = ringRef.current;
      if (ring) {
        ring.style.transform = next ? 'scale(2)' : 'scale(1)';
        ring.style.opacity = next ? '0.88' : '1';
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden md:block" style={{ cursor: 'none' }}>
      <div
        ref={wrapRef}
        className="absolute left-0 top-0 will-change-transform"
        style={{
          transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%)',
          contain: 'layout style',
        }}
      >
        <div
          ref={ringRef}
          className="size-[22px] rounded-full border-2 border-neon-purple/70 bg-transparent"
          style={{
            transform: 'scale(1)',
            transformOrigin: 'center center',
            boxShadow:
              '0 0 14px hsl(272 72% 46% / 0.35), 0 0 28px hsl(340 100% 65% / 0.12)',
            willChange: 'transform',
          }}
        />
      </div>
    </div>
  );
}
