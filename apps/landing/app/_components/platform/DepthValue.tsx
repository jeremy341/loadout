import { formatDepth, type Hours } from "@/lib/platform/progress";

// A depth readout: approved hours in metres, with pending hours hatched beside it. One metre is one approved hour.
// The accessible name spells out the hours, since "-12 M" alone does not say what it counts.
export function DepthValue({ hours }: Readonly<{ hours: Hours }>) {
  const label = `Depth ${formatDepth(hours.approved)}, from ${hours.approved} approved hours${
    hours.pending > 0 ? ` and ${hours.pending} hours pending review` : ""
  }`;
  return (
    <span className="pf-depth-value" role="img" aria-label={label}>
      <span aria-hidden="true">{formatDepth(hours.approved)}</span>
      {hours.pending > 0 ? <span className="pf-depth-pending" aria-hidden="true">+{hours.pending} H</span> : null}
    </span>
  );
}
