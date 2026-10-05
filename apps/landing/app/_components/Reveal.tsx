"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function Reveal({ children, className = "", delay = 0, stagger = false }: { children: React.ReactNode; className?: string; delay?: number; stagger?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -48px 0px" });
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const show = !ready || reduceMotion || inView;
  return <motion.div ref={ref} className={`reveal ${className}`} initial={false} data-revealed={show} data-stagger={stagger || undefined}
    animate={{ opacity: stagger || show ? 1 : 0, y: stagger || show ? 0 : 22 }}
    transition={{ duration: reduceMotion ? 0 : 0.55, delay: show ? delay : 0, ease: [0.22, 1, 0.36, 1] }}>
    {children}
  </motion.div>;
}
