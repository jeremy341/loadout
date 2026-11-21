// Loads sharp the way Next.js itself does. sharp is not a dependency of this app: it arrives as an optional package of Next, so a
// plain import("sharp") cannot be resolved from app code under bun's layout. This looks for it from the app folder first (it works if
// the app ever declares it) and then from beside Next. Server only. Throws when sharp cannot be found, and callers refuse the upload.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Only the parts of sharp the upload code uses, so type checking does not depend on where sharp is installed.
export type SharpPipeline = {
  rotate(): SharpPipeline;
  resize(...args: unknown[]): SharpPipeline;
  jpeg(options?: object): SharpPipeline;
  png(options?: object): SharpPipeline;
  webp(options?: object): SharpPipeline;
  withExif(exif: object): SharpPipeline;
  metadata(): Promise<{ format?: string; exif?: unknown; width?: number; height?: number }>;
  toBuffer(): Promise<Buffer>;
  toBuffer(options: { resolveWithObject: true }): Promise<{ data: Buffer; info: { width: number; height: number } }>;
};
export type Sharp = (input?: Uint8Array | object, options?: object) => SharpPipeline;

let cached: Promise<Sharp> | null = null;

function find(): string {
  const here = createRequire(path.join(process.cwd(), "package.json"));
  const tries: Array<() => string> = [
    () => here.resolve("sharp"),
    () => createRequire(here.resolve("next/package.json")).resolve("sharp"),
  ];
  for (const attempt of tries) {
    try {
      return attempt();
    } catch {
      // try the next place
    }
  }
  throw new Error("sharp not found");
}

export function loadSharp(): Promise<Sharp> {
  cached ??= (async () => {
    const file = find();
    const mod = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ pathToFileURL(file).href)) as { default?: Sharp };
    if (typeof mod.default !== "function") throw new Error("sharp did not load");
    return mod.default;
  })();
  cached.catch(() => {
    cached = null;
  });
  return cached;
}
