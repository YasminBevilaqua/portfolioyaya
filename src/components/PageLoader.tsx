import { useCallback, useEffect, useState } from 'react';

const MIN_MS = 900;

/**
 * Tela de carregamento — átomo 3D (órbitas + núcleo nas cores neon do site).
 */
export default function PageLoader() {
  const [phase, setPhase] = useState<'show' | 'hide' | 'gone'>('show');

  const finish = useCallback(() => {
    setPhase((p) => (p === 'show' ? 'hide' : p));
  }, []);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const t0 = performance.now();
    const run = () => {
      if (prefersReduced) {
        setPhase('gone');
        return;
      }
      const elapsed = performance.now() - t0;
      const wait = Math.max(0, MIN_MS - elapsed);
      window.setTimeout(finish, wait);
    };

    if (document.readyState === 'complete') {
      run();
    } else {
      window.addEventListener('load', run, { once: true });
    }
    return () => window.removeEventListener('load', run);
  }, [finish]);

  if (phase === 'gone') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={phase === 'show'}
      className={`page-loader ${phase === 'hide' ? 'page-loader--out' : ''}`}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'opacity' && phase === 'hide') {
          setPhase('gone');
        }
      }}
    >
      <div className="page-loader__inner">
        <div className="atom-scene">
          {/* Núcleo fixo no centro */}
          <span className="atom-nucleus" aria-hidden />
          {/* Órbitas: cada anel gira no próprio plano (translado do arco) + conjunto em precessão lenta */}
          <div className="atom-spin" aria-hidden>
            <div className="atom-orbit-wrap atom-orbit-wrap--a">
              <div className="atom-orbit-precess atom-orbit-precess--lr">
                <div className="atom-orbit-ring atom-orbit-ring--a" />
              </div>
            </div>
            <div className="atom-orbit-wrap atom-orbit-wrap--b">
              <div className="atom-orbit-precess atom-orbit-precess--tb">
                <div className="atom-orbit-ring atom-orbit-ring--b" />
              </div>
            </div>
            <div className="atom-orbit-wrap atom-orbit-wrap--c">
              <div className="atom-orbit-precess atom-orbit-precess--dlr">
                <div className="atom-orbit-ring atom-orbit-ring--c" />
              </div>
            </div>
            <div className="atom-orbit-wrap atom-orbit-wrap--d">
              <div className="atom-orbit-precess atom-orbit-precess--drl">
                <div className="atom-orbit-ring atom-orbit-ring--d" />
              </div>
            </div>
            <div className="atom-orbit-wrap atom-orbit-wrap--e">
              <div className="atom-orbit-precess atom-orbit-precess--lr atom-orbit-precess--rev">
                <div className="atom-orbit-ring atom-orbit-ring--e" />
              </div>
            </div>
            <div className="atom-orbit-wrap atom-orbit-wrap--f">
              <div className="atom-orbit-precess atom-orbit-precess--tb atom-orbit-precess--rev">
                <div className="atom-orbit-ring atom-orbit-ring--f" />
              </div>
            </div>
          </div>
        </div>
        <p className="page-loader__label">Carregando</p>
      </div>
    </div>
  );
}
