"use client";

import { useEffect, useRef, type PointerEvent } from "react";

import { useMotionPreference } from "../motion-preference";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*";
const ITERATIONS = 7;
const SPEED = 16; // ms, grows by 20% each redraw
const RIPPLE = 1; // neighbouring letters on each side that scramble with the hovered one
const LETTER = /[A-Za-z0-9]/;

const randomChar = () => CHARSET[Math.floor(Math.random() * CHARSET.length)];

// A line of text whose letters scramble when the pointer passes over them, rippling to their
// neighbours. The real text is always in the page for screen readers; the lettered copy is
// decorative. Reduced motion leaves the text still. Redraws touch the DOM directly, not React.
export function HoverScramble({ text }: { text: string }) {
  const { paused } = useMotionPreference();
  const line = useRef<HTMLSpanElement>(null);
  const busy = useRef(new Set<number>());
  const hovered = useRef(-1);
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const pending = timers.current;
    const active = busy.current;
    const element = line.current;
    const restore = () => {
      pending.forEach((id) => window.clearTimeout(id));
      pending.clear();
      active.clear();
      Array.from(element?.children ?? []).forEach((box, index) => { box.textContent = text[index]; });
    };
    if (paused) restore();
    return restore;
  }, [paused, text]);

  // The letter's box, or nothing when it is a space, a symbol or past the end of the line.
  function letterBox(index: number) {
    const box = line.current?.children[index] as HTMLElement | undefined;
    return box && LETTER.test(text[index]) ? box : null;
  }

  function scrambleAt(index: number) {
    const box = letterBox(index);
    const real = text[index];
    if (!box || busy.current.has(index)) return;
    // Fix the letter's box to its real width so the line does not shift while it changes.
    if (!box.style.width) {
      box.style.width = `${parseFloat(getComputedStyle(box).width)}px`;
      box.style.display = "inline-block";
      box.style.textAlign = "center";
    }
    busy.current.add(index);
    const step = (iteration: number) => {
      if (iteration >= ITERATIONS) {
        box.textContent = real;
        busy.current.delete(index);
        return;
      }
      box.textContent = randomChar();
      const id = window.setTimeout(() => {
        timers.current.delete(id);
        step(iteration + 1);
      }, SPEED * Math.pow(1.2, iteration + 1));
      timers.current.add(id);
    };
    step(0);
  }

  function onPointerOver(event: PointerEvent<HTMLSpanElement>) {
    if (paused) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-i]");
    if (!target) return;
    const index = Number(target.dataset.i);
    // Chrome repeats pointerover on the same letter each time its text changes; only a new letter counts.
    if (index === hovered.current) return;
    hovered.current = index;
    scrambleAt(index);
    for (let offset = 1; offset <= RIPPLE; offset++) {
      for (const neighbour of [index - offset, index + offset]) {
        const id = window.setTimeout(() => {
          timers.current.delete(id);
          scrambleAt(neighbour);
        }, offset * 15);
        timers.current.add(id);
      }
    }
  }

  return (
    <>
      <span className="hs-sr">{text}</span>
      <span ref={line} className="hs" aria-hidden="true" onPointerOver={onPointerOver} onPointerLeave={() => { hovered.current = -1; }}>
        {[...text].map((char, index) => (
          <span key={index} data-i={index}>{char}</span>
        ))}
      </span>
    </>
  );
}
