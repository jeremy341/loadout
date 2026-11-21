import "./states.css";

type Props = Readonly<{
  // card: a project card (cover and three lines); row: one grey line of text; block: a free box sized by the caller.
  shape?: "card" | "row" | "block";
  // How many to draw.
  count?: number;
  // The status text for screen readers. Only the first skeleton on a page needs it.
  label?: string;
}>;

// A placeholder that has the shape of what is loading, drawn in the track dither, never a spinner. Screen readers hear one
// "Loading" status. The shimmer is a stepped fade that stops under reduced motion (states.css).
export function Skeleton({ shape = "block", count = 1, label }: Props) {
  const items = Array.from({ length: count }, (_, index) => index);
  return (
    <>
      {label ? <p className="pf-sr" role="status">{label}</p> : null}
      {items.map((index) =>
        shape === "card" ? (
          <div className="pf-skel pf-skel-card" aria-hidden="true" key={index}>
            <span className="pf-skel-cover" />
            <span className="pf-skel-line" />
            <span className="pf-skel-line pf-skel-short" />
          </div>
        ) : shape === "row" ? (
          <span className="pf-skel pf-skel-line" aria-hidden="true" key={index} />
        ) : (
          <span className="pf-skel pf-skel-block" aria-hidden="true" key={index} />
        ),
      )}
    </>
  );
}
