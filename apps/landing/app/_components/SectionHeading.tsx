import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, children, headingId }: { eyebrow: string; title: string; children: ReactNode; headingId?: string }) {
  return (
    <div className="section-heading">
      <span className="section-eyebrow">{eyebrow}</span>
      <h2 id={headingId}>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
