import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { prewarmAboutPlanetTexturesChunked } from "@/lib/aboutPlanetTextures";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import PageLoader from "./components/PageLoader.tsx";
import StarsCanvas from "./components/star-background.tsx";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    let cleanupWarmTextures: (() => void) | null = null;
    const warm = () => {
      // Precarrega o chunk da seção Sobre e aquece texturas em partes.
      import("./components/About.tsx");
      cleanupWarmTextures = prewarmAboutPlanetTexturesChunked();
    };

    let timeoutId: number | null = null;
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const w = window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout?: number }) => number;
        cancelIdleCallback: (id: number) => void;
      };
      const idleId = w.requestIdleCallback(warm, { timeout: 1500 });
      return () => {
        w.cancelIdleCallback(idleId);
        cleanupWarmTextures?.();
      };
    }

    timeoutId = window.setTimeout(warm, 300);
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      cleanupWarmTextures?.();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StarsCanvas />
        <PageLoader />
        <Toaster />
        <Sonner />
        <HashRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
