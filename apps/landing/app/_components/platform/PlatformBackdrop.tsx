import { NoiseGrain } from "../NoiseGrain";

// The page-wide layer the platform keeps from the homepage: the shared film grain, which already follows the grain
// preference and reduced motion. It is decorative and never takes input. The homepage's scroll-driven darkening is not
// used here, so a platform page keeps the same colours from top to bottom.
export function PlatformBackdrop() {
  return <NoiseGrain />;
}
