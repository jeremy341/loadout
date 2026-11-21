"use client";

import { useRef, type PointerEvent } from "react";
import { PROJECT_DESCRIPTION_MAX } from "@/lib/platform/projects";
import { ProjectCover } from "./ProjectCover";
import "./projects.css";

// The project card as the grid draws it, but not a link, fed with the wizard's draft. An empty title reads "untitled".
// On a fine pointer, with motion allowed, it tilts at most 2 degrees toward the pointer.
export function ProjectPreviewCard({ title, description, track }: Readonly<{ title: string; description: string; track: string | null }>) {
  const card = useRef<HTMLDivElement>(null);
  const text = description.trim();

  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    const element = card.current;
    if (!element || event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motionPaused === "true") return;
    const box = element.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    element.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
  };
  const rest = () => {
    if (card.current) card.current.style.transform = "";
  };

  return (
    <div ref={card} className="pf-card pf-project-card pf-projects-card pf-wiz-preview" onPointerMove={tilt} onPointerLeave={rest} data-testid="project-preview">
      <ProjectCover status="draft" track={track || null} hours={{ approved: 0, pending: 0 }} />
      <span className="pf-project-body">
        <span className="pf-projects-title" data-empty={title.trim() ? undefined : "true"}>{title.trim() || "untitled"}</span>
        <span className={text ? "pf-card-text pf-clamp" : "pf-card-text pf-muted"}>
          {(text || "No description yet.").slice(0, PROJECT_DESCRIPTION_MAX)}
        </span>
      </span>
    </div>
  );
}
