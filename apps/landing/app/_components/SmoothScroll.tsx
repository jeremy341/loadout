"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    let observer: ResizeObserver | undefined;
    let frame = 0;
    function stop() {
      cancelAnimationFrame(frame);
      lenis?.destroy();
      observer?.disconnect();
      lenis = undefined;
    }
    function syncPreference() {
      stop();
      if (preference.matches) return;
      lenis = new Lenis({ anchors: { offset: -90 }, duration: 1.1 });
      function raf(time: number) {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      }
      frame = requestAnimationFrame(raf);
      observer = new ResizeObserver(() => lenis?.resize());
      observer.observe(document.body);
    }
    syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => {
      preference.removeEventListener("change", syncPreference);
      stop();
    };
  }, []);

  return <>{children}</>;
}
