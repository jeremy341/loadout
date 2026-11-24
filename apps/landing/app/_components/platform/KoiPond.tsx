"use client";

import { useEffect, useRef } from "react";
import "./koi.css";

// ASCII koi swimming over the whole platform as one pond: behind the sidebar, behind the page, and from one to the other without a break.
// The engine is the vendored MIT ascii-koi pond (public/vendor/ascii-koi, see NOTICE.md), drawn on a transparent canvas with no water
// texture, so the fish bring their own pixels and the page grid is left alone. It is decoration only: aria-hidden, never takes focus
// or clicks, off when "Hide ASCII drawings" is on, still under reduced motion or "Reduce motion", and paused by the browser while the
// tab is hidden. Where text sits over the water the fish fade to a ghost so the words stay readable.

type Palette = { water: string; ink: string; accent: string; koiLight: string; koiDark: string; dark: boolean; koi: string[] };
type Clearing = { left: number; top: number; right: number; bottom: number; fade: number; min: number };
type Pond = { size(width: number, height: number): void; start(): void; stop(): void };
type Engine = {
  createPond(options: {
    canvas: HTMLCanvasElement;
    palette: () => Palette;
    reduce: boolean;
    clear: boolean;
    bare: boolean;
    count: number;
    most: number;
    dpr: () => number;
    dim: () => Clearing[] | null;
  }): Pond;
};

const SRC = "/vendor/ascii-koi/pond.js";
let loading: Promise<Engine> | null = null;

function loadEngine(): Promise<Engine> {
  const ready = (window as unknown as { AsciiKoi?: Engine }).AsciiKoi;
  if (ready) return Promise.resolve(ready);
  loading ??= new Promise<Engine>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.onload = () => {
      const engine = (window as unknown as { AsciiKoi?: Engine }).AsciiKoi;
      if (engine) resolve(engine);
      else reject(new Error("The koi engine did not start."));
    };
    script.onerror = () => reject(new Error("The koi engine did not load."));
    document.head.appendChild(script);
  });
  return loading;
}

// The site colours. In the dark theme the markings are the site colours (blue, teal, gold and a deeper blue); on the stone paper they are the
// rust accent and deeper versions of the same hues.
const DARK: Palette = { water: "#222627", ink: "#E9EBE7", accent: "#5E9EF4", koiLight: "#E9EBE7", koiDark: "#16191A", dark: true, koi: ["#5E9EF4", "#6FC2BB", "#E3C26B", "#4A7FD0"] };
const LIGHT: Palette = { water: "#DDD3BF", ink: "#1A1714", accent: "#C4491F", koiLight: "#FBF3E4", koiDark: "#1A1714", dark: false, koi: ["#C4491F", "#2F7F78", "#3A66B0", "#C9962A"] };

// The pond is drawn on a bigger canvas than it is shown on, so the fish come out smaller.
const SCALE = 1.6;

export function KoiPond({ sidebar = true }: { sidebar?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = box.current;
    const surface = canvas.current;
    if (!element || !surface) return;
    const root = document.documentElement;
    let pond: Pond | null = null;
    let running = false;
    let alive = true;

    const palette = () => (root.dataset.displayTheme === "light" ? LIGHT : DARK);
    const hidden = () => root.dataset.hideAscii === "true";
    const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || root.dataset.motionPaused === "true";
    // The engine needs a real size before it can draw, so it starts only once the box has one (and again after a resize).
    const fit = () => {
      const rect = element.getBoundingClientRect();
      if (!pond || !rect.width || !rect.height) return;
      pond.size(rect.width * SCALE, rect.height * SCALE);
      if (!running) {
        running = true;
        try {
          pond.start();
        } catch {
          running = false;
        }
      }
    };
    // The fish fade to a ghost under reading text: the sidebar and each top-level block of the page (headings, tabs, lists, cards, the
    // wizard card). Between blocks and in the margins they stay at full strength, so the pond is still one pond across the page, but
    // no word is ever read through a fish. A fixed layer behind the content, so scrolling only moves the rectangles.
    const dim = (): Clearing[] | null => {
      const areas: Element[] = [];
      const side = document.querySelector(".pf-side");
      if (side) areas.push(side);
      const main = document.getElementById("platform-main");
      const card = main?.querySelector(":scope > .pf-focus-card");
      const blocks = Array.from((card ?? main)?.children ?? []);
      areas.push(...(blocks.length ? blocks : main ? [main] : []));
      const out: Clearing[] = [];
      for (const area of areas.slice(0, 40)) {
        const rect = area.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.right <= 0 || rect.bottom <= 0 || rect.top >= window.innerHeight) continue;
        out.push({ left: rect.left * SCALE, top: rect.top * SCALE, right: rect.right * SCALE, bottom: rect.bottom * SCALE, fade: 36, min: area === side ? 0.14 : 0.12 });
      }
      return out.length ? out : null;
    };

    // The documentation pages are for reading, so the fish stay out of them.
    const readingPage = () => window.location.pathname.startsWith("/docs");
    const start = async () => {
      if (pond || hidden() || readingPage()) return;
      let engine: Engine;
      try {
        engine = await loadEngine();
      } catch {
        return;
      }
      if (!alive || pond || hidden() || readingPage()) return;
      pond = engine.createPond({
        canvas: surface,
        palette,
        reduce: calm(),
        clear: true,
        bare: true,
        count: 4,
        most: 6,
        dpr: () => Math.min(2, window.devicePixelRatio || 1),
        dim,
      });
      fit();
    };
    const stop = () => {
      if (running) pond?.stop();
      running = false;
      pond = null;
    };

    void start();
    const resize = new ResizeObserver(fit);
    resize.observe(element);
    // A change of theme, of the ASCII choice or of the motion choice is picked up from the page's own settings.
    const watch = new MutationObserver(() => {
      stop();
      if (!hidden()) void start();
    });
    watch.observe(root, { attributes: true, attributeFilter: ["data-hide-ascii", "data-motion-paused", "data-display-theme"] });
    return () => {
      alive = false;
      resize.disconnect();
      watch.disconnect();
      stop();
    };
  }, []);

  return (
    <div ref={box} className="pf-koi" aria-hidden="true">
      {/* The sidebar keeps its grey. It is drawn here, under the fish, so they swim over it; the sidebar itself is see-through and its words stay on top. */}
      {sidebar ? <div className="pf-koi-side" /> : null}
      <canvas ref={canvas} />
    </div>
  );
}
