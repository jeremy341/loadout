"use client";

// Scroll reveal ported from main (cd1834a): fades and slides a section up once it is in view, and
// can stagger the cards inside it. Content stays visible until hydration, and with reduced motion.

import { useMotionPreference } from "../motion-preference";
import { useEffect, useRef, useState } from "react";

export default function Reveal({ children, className = "", delay = 0, stagger = false }: { children: React.ReactNode; className?: string; delay?: number; stagger?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { paused: reduceMotion } = useMotionPreference();
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || reduceMotion) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setInView(true);
      observer.disconnect();
    }, { rootMargin: "0px 0px -48px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const show = !ready || reduceMotion || inView;
  return <div ref={ref} className={`reveal ${className}`} data-revealed={show} data-stagger={stagger || undefined}
    style={{ "--reveal-delay": show ? `${delay * 1000}ms` : "0ms" } as React.CSSProperties}>
    {children}
  </div>;
}
