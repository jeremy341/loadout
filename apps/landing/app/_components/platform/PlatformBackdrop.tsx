import { NoiseGrain } from "../NoiseGrain";

// The two page-wide layers the homepage has, for every platform page: the darkening depth layer
// (platform.css, a CSS scroll-driven animation, nothing in React) and the shared film grain, which
// already follows the grain preference and reduced motion. Both are decorative and never take input.
export function PlatformBackdrop() {
  return (
    <>
      <div className="pf-depth" aria-hidden="true" />
      <NoiseGrain />
    </>
  );
}
