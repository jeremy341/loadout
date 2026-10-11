"use client";

import { useEffect, useRef } from "react";
import "../grain.css";

const TILE = 512; // px, the noise tile that is shifted around
const INTERVAL = 100; // ms between two frames, as on Stasis
const ALPHA = 51; // of 255 per pixel; the canvas itself is then drawn at 40% opacity (grain.css)

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

// Lays the tile over the whole canvas at a random offset.
function drawGrain(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, pattern: CanvasPattern) {
  if (!canvas.width || !canvas.height) return;
  const x = Math.floor(Math.random() * TILE);
  const y = Math.floor(Math.random() * TILE);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(1, 0, 0, 1, -x, -y);
  context.fillStyle = pattern;
  context.fillRect(x, y, canvas.width, canvas.height);
}

// Starts the grain on a canvas and returns the function that stops it. Visitors who ask for
// reduced motion get a single still frame instead of a frame every 100ms.
function startGrain(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  const pattern = context && makeNoisePattern(context);
  if (!context || !pattern) return undefined;

  const draw = () => drawGrain(canvas, context, pattern);
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
  };
  resize();
  window.addEventListener("resize", resize);
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timer = still ? 0 : window.setInterval(() => {
    if (document.visibilityState === "visible") draw();
  }, INTERVAL);

  return () => {
    window.removeEventListener("resize", resize);
    window.clearInterval(timer);
  };
}

// Film grain in the manner of the Stasis homepage: a full-screen canvas of random grey noise that
// refreshes ten times a second, drawn softly over the whole page. Stasis re-rolls every pixel
// on each frame; here one noise tile is rolled once and laid down at a random offset each frame,
// which looks the same and costs almost nothing. It never takes pointer input.
export function NoiseGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => (canvasRef.current ? startGrain(canvasRef.current) : undefined), []);
  return <canvas ref={canvasRef} className="grain" aria-hidden="true" role="presentation" />;
}
