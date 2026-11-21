// biome-ignore-all lint/correctness/useExhaustiveDependencies: usePathStrokeMetrics intentionally accepts caller-controlled deps
import { type RefObject, useEffect, useRef, useState } from "react";

export function findPathLengthAtX(
  path: SVGPathElement | null,
  pathLength: number,
  targetX: number
): number {
  if (!path || pathLength === 0) {
    return 0;
  }
  let low = 0;
  let high = pathLength;
  const tolerance = 0.5;

  while (high - low > tolerance) {
    const mid = (low + high) / 2;
    const point = path.getPointAtLength(mid);
    if (point.x < targetX) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

interface PathStrokeMetrics {
  pathD: string | null;
  pathLength: number;
}

const EMPTY_METRICS: PathStrokeMetrics = { pathD: null, pathLength: 0 };

/**
 * `deps` is a freshly-built caller array each render; the effect below must
 * re-run when any element changes (compared like React compares effect
 * dependencies), but the dependency array itself has to be static. Compress
 * that element-wise comparison into an incrementing token the effect can
 * list instead of spreading `deps` (which would advance by one whenever the
 * values change, exactly like the token does).
 */
function useDepsChangeToken(deps: readonly unknown[]): number {
  const prevDeps = useRef<readonly unknown[]>(deps);
  const token = useRef(0);
  const changed =
    prevDeps.current.length !== deps.length ||
    deps.some((dep, i) => !Object.is(dep, prevDeps.current[i]));
  if (changed) {
    prevDeps.current = deps;
    token.current += 1;
  }
  return token.current;
}

/**
 * Caller passes the references that drive the rendered path (renderData,
 * innerWidth, etc.) as `deps`. A stringified summary like
 * `${renderData.length}:${innerWidth}` is *not* safe here — same-length
 * in-place mutations of `renderData` keep the summary identical, so the
 * effect would never re-fire and `pathD`/`pathLength` would stay frozen on
 * the previous geometry (the area fill repaints from `renderData` directly
 * and would diverge from the stroke).
 */
export function usePathStrokeMetrics(
  pathRef: RefObject<SVGPathElement | null>,
  deps: readonly unknown[],
  /**
   * Skip measuring while nothing reads the metrics (no dash tail / loading
   * pulse): `getTotalLength()` on a long path plus the follow-up render is
   * real work on every data update. Flipping to true re-measures.
   */
  enabled = true
): PathStrokeMetrics {
  const [metrics, setMetrics] = useState<PathStrokeMetrics>(EMPTY_METRICS);
  const depsToken = useDepsChangeToken(deps);

  useEffect(() => {
    const path = pathRef.current;
    if (!(enabled && path)) {
      return;
    }
    const d = path.getAttribute("d");
    const len = d ? path.getTotalLength() : 0;
    setMetrics((prev) =>
      prev.pathD === d && prev.pathLength === len
        ? prev
        : { pathD: d, pathLength: len }
    );
  }, [enabled, pathRef, depsToken]);

  return metrics;
}

export function resolveDashTailBounds(
  dashFromIndex: number | undefined,
  dataLength: number
): boolean {
  return (
    dashFromIndex != null &&
    dashFromIndex >= 0 &&
    dashFromIndex < dataLength - 1
  );
}

export function resolveDashStartX(
  data: Record<string, unknown>[],
  dashFromIndex: number,
  xScale: (value: Date | number) => number | undefined,
  xAccessor: (datum: Record<string, unknown>) => Date | number
): number {
  const dashFromPoint = data[dashFromIndex];
  if (!dashFromPoint) {
    return 0;
  }
  return xScale(xAccessor(dashFromPoint)) ?? 0;
}
