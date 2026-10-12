"use client";

import { useEffect } from "react";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+";
const STEP = 60; // ms between random redraws
const LETTER = /[A-Za-z0-9]/;

const randomChar = () => CHARSET[Math.floor(Math.random() * CHARSET.length)];

// The advance of every character in a text node, read from the real text with its kerning, so
// letters placed at these widths land exactly where the real letters would. Read before anything
// changes. `scale` is the heading's entrance scale: dividing by it keeps the advances in layout pixels.
function advances(node: Text, scale: number): number[] {
  const text = node.textContent ?? "";
  const range = document.createRange();
  const lefts: number[] = [];
  let right = 0;
  for (let i = 0; i < text.length; i++) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const rect = range.getBoundingClientRect();
    lefts.push(rect.left);
    right = rect.right;
  }
  return lefts.map((left, i) => ((i + 1 < lefts.length ? lefts[i + 1] : right) - left) / scale);
}

// Scrambles one heading: every letter is shown as random characters, then locks to the real
// one at a staggered time. Each letter sits in a box fixed to its real width, so the heading
// never reflows while it runs. Returns a function that puts the original text back.
function scramble(heading: HTMLElement, duration: number, onDone: () => void): () => void {
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.textContent?.trim()) textNodes.push(node as Text);
  }
  // Join the text nodes with spaces so lines in separate elements keep a gap in the name.
  const label = textNodes.map((node) => (node.textContent ?? "").trim()).join(" ");

  const swaps: { original: Text; inserted: ChildNode[] }[] = [];
  const letters: { box: HTMLSpanElement; real: string }[] = [];
  const scale = heading.getBoundingClientRect().width / heading.offsetWidth || 1;
  const readings = textNodes.map((node) => advances(node, scale));
  textNodes.forEach((original, nodeIndex) => {
    const advance = readings[nodeIndex];
    const inserted: ChildNode[] = [];
    let offset = 0;
    for (const token of (original.textContent ?? "").split(/(\s+)/)) {
      if (!token) continue;
      if (/^\s+$/.test(token)) {
        inserted.push(document.createTextNode(token));
      } else {
        const word = document.createElement("span");
        word.className = "scr-w";
        for (let k = 0; k < token.length; k++) {
          const char = token[k];
          if (LETTER.test(char)) {
            const box = document.createElement("span");
            box.className = "scr-c";
            box.style.width = `${advance[offset + k]}px`;
            box.style.textAlign = "left";
            box.textContent = char;
            word.append(box);
            letters.push({ box, real: char });
          } else {
            word.append(document.createTextNode(char));
          }
        }
        inserted.push(word);
      }
      offset += token.length;
    }
    original.replaceWith(...inserted);
    swaps.push({ original, inserted });
  });

  letters.forEach(({ box }) => {
    box.textContent = randomChar();
  });
  heading.setAttribute("aria-label", label);

  const locks = letters.map((_, index) => Math.random() * 300 + (index / Math.max(letters.length, 1)) * (duration - 300));
  const start = performance.now();
  let last = 0;
  let frame = 0;
  let restored = false;

  const restore = () => {
    if (restored) return;
    restored = true;
    cancelAnimationFrame(frame);
    for (const { original, inserted } of swaps) {
      inserted[0]?.before(original);
      for (const node of inserted) node.parentNode?.removeChild(node);
    }
    heading.removeAttribute("aria-label");
  };

  const tick = (now: number) => {
    const elapsed = now - start;
    if (elapsed >= duration + STEP) {
      restore();
      onDone();
      return;
    }
    if (now - last >= STEP) {
      last = now;
      letters.forEach(({ box, real }, index) => {
        const next = elapsed >= locks[index] ? real : randomChar();
        if (box.textContent !== next) box.textContent = next;
      });
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return restore;
}

// Scrambles the matching headings the first time they are in view. The text stays in the
// heading the whole time (its accessible name is set to the real text while it runs), and
// visitors who prefer reduced motion see it untouched. `duration` is the time until the last
// letter settles. The homepage uses it on the hero title only.
export function ScrambleHeadings({ selector, duration = 1600 }: { selector: string; duration?: number }) {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const running = new Set<() => void>();
    let disposed = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (reduceMotion.matches) continue;
          // Measure the letters only once the real font is in place. The heading is in view
          // on the first paint, before the pixel font has loaded, so measuring then would fix
          // every letter box to the fallback font's width, and the title would jump when the
          // real font swapped in.
          const heading = entry.target as HTMLElement;
          void document.fonts.ready.then(() => {
            if (disposed) return;
            const stop = scramble(heading, duration, () => running.delete(stop));
            running.add(stop);
          });
        }
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll<HTMLElement>(selector).forEach((heading) => observer.observe(heading));
    return () => {
      disposed = true;
      observer.disconnect();
      running.forEach((stop) => stop());
    };
  }, [selector, duration]);

  return null;
}
