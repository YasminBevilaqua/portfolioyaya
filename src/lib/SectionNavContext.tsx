import { createContext, useContext, useState, type ReactNode } from 'react';

export type SectionId = 'hero' | 'about' | 'projects' | 'contact';

interface SectionNavCtx {
  active: SectionId;
  go: (id: SectionId) => void;
}

const Ctx = createContext<SectionNavCtx>({ active: 'hero', go: () => {} });

export function SectionNavProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<SectionId>('hero');
  return <Ctx.Provider value={{ active, go: setActive }}>{children}</Ctx.Provider>;
}

export function useSectionNav() {
  return useContext(Ctx);
}
