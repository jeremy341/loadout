"use client";

import { useEffect, useRef } from "react";
import "../grain.css";
import { useDisplayPreferences } from "./display-preferences";
import { useMotionPreference } from "./motion-preference";

const TILE = 512; // px, the noise tile that is shifted around
const INTERVAL = 100; // ms between two frames, as on Stasis
const ALPHA = 51; // of 255 per pixel; the canvas itself is then drawn at 33% opacity (grain.css)

// One tile of random grey noise, turned into a repeating pattern. A pattern is a snapshot of the
// tile at the moment it is made, so it is made after the noise is in.
function makeNoisePattern(context: CanvasRenderingContext2D) {
  const tile = document.createElement("canvas");
  tile.width = TILE;
  tile.height = TILE;
  const tileContext = tile.getContext("2d");
  if (!tileContext) return null;
  const noise = tileContext.createImageData(TILE, TILE);
  for (let index = 0; index < noise.data.length; index += 4) {
    noise.data.fill(Math.random() * 255, index, index + 3);
    noise.data[index + 3] = ALPHA;
  }
  tileContext.putImageData(noise, 0, 0);
  return context.createPattern(tile, "repeat");
}

// Paint once, then shift the oversized canvas to change the tile phase without repainting the viewport.
function drawGrain(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, pattern: CanvasPattern) {
  if (!canvas.width || !canvas.height) return;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = pattern;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

// Starts the grain on a canvas and returns the function that stops it. Visitors who ask for
// reduced motion get a single still frame instead of a frame every 100ms.
function startGrain(canvas: HTMLCanvasElement, paused: boolean) {
  const context = canvas.getContext("2d");
  const pattern = context && makeNoisePattern(context);
  if (!context || !pattern) return undefined;

  let pad = 0;
  const draw = () => drawGrain(canvas, context, pattern);
  const resize = () => {
    pad = Math.min(TILE, Math.max(1, Math.floor(Math.min(window.innerWidth, window.innerHeight) / 8)));
    canvas.width = window.innerWidth + pad;
    canvas.height = window.innerHeight + pad;
    canvas.style.left = `${-pad}px`;
    canvas.style.top = `${-pad}px`;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    canvas.style.transform = "translate3d(0px, 0px, 0px)";
    draw();
  };
  resize();
  window.addEventListener("resize", resize);
  const still = paused;
  canvas.dataset.animated = String(!still);
  const shift = () => {
    canvas.style.transform = `translate3d(${Math.floor(Math.random() * pad)}px, ${Math.floor(Math.random() * pad)}px, 0)`;
  };
  let timer: number | undefined;
  const animate = () => {
    if (!still && document.visibilityState === "visible" && timer === undefined) {
      timer = window.setInterval(shift, INTERVAL);
    }
  };
  const pause = () => {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      canvas.dataset.animated = String(!still);
      shift();
      animate();
    } else {
      canvas.dataset.animated = "false";
      pause();
    }
  };
  if (!still) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    onVisibilityChange();
  }

  return () => {
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    pause();
  };
}

// Film grain in the manner of the Stasis homepage: a full-screen canvas of random grey noise that
// refreshes ten times a second, drawn softly over the whole page. Stasis re-rolls every pixel
// on each frame; here one noise tile is rolled once and laid down at a random offset each frame,
// which looks the same and costs almost nothing. It never takes pointer input.
export function NoiseGrain() {
  const { paused } = useMotionPreference();
  const { grain } = useDisplayPreferences();
  const hideGrain = grain === "off";
  const still = paused || grain === "still";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => (!hideGrain && canvasRef.current ? startGrain(canvasRef.current, still) : undefined), [still, hideGrain]);
  if (hideGrain) return null;
  return <canvas ref={canvasRef} className="grain" aria-hidden="true" role="presentation" />;
}
