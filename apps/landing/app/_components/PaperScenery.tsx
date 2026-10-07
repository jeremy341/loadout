"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const clouds = [
  [3, "left", 1], [2, "right", 2], [10, "right", 3], [12, "left", 2], [19, "left", 3], [23, "right", 1],
  [33, "left", 1], [38, "right", 2], [49, "left", 2], [52, "right", 3], [60, "left", 3], [65, "right", 1],
  [74, "left", 1], [80, "right", 2], [88, "left", 3], [90, "right", 1],
] as const;

function ScrollCloud({ top, side, variant, index }: { top: number; side: "left" | "right"; variant: number; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const [range, setRange] = useState(160);
  useEffect(() => {
    const smallScreen = window.matchMedia("(max-width: 700px)");
    const sync = () => setRange(smallScreen.matches ? 72 : 160);
    const frame = requestAnimationFrame(sync);
    smallScreen.addEventListener("change", sync);
    return () => { cancelAnimationFrame(frame); smallScreen.removeEventListener("change", sync); };
  }, []);
  const targetX = useTransform(scrollYProgress, [0, 1], side === "left" ? [-range, range] : [range, -range]);
  const x = useSpring(0, { stiffness: 90, damping: 26, mass: 0.4 });

  useEffect(() => {
    if (reduceMotion) {
      x.jump(0);
      return;
    }
    x.set(targetX.get());
    const stopX = targetX.on("change", (value) => x.set(value));
    return stopX;
  }, [reduceMotion, targetX, x, range]);

  return <motion.div ref={ref} className={`pixel-cloud cloud-${side}`} style={{ top: `${top}%`, x }}>
    <svg className="cloud-art" style={{ animationDelay: `${-index * 3}s` }} viewBox="0 0 200 70"><image href={`/loadout/cloud-${variant}.svg`} width="200" height="70" /></svg>
  </motion.div>;
}

export function PaperScenery() {
  return <div className="paper-scenery" aria-hidden="true">
    {clouds.map(([top, side, variant], index) => <ScrollCloud key={index} top={top} side={side} variant={variant} index={index} />)}
    {Array.from({ length: 22 }, (_, index) => <span className={`registration-mark mark-${index % 2 ? "right" : "left"}`} style={{ top: `${2 + index * 4.1}%` }} key={`mark-${index}`}>+</span>)}
    <div className="pixel-skyline" />
  </div>;
}
