import Link from "next/link";
import { projectHours } from "@/lib/platform/progress";
import "./profile.css";

type Pin = { id: string; title: string; track: string | null; usedBy: number; openSource: boolean };

// Up to three pinned approved projects as compact plates, so a project is not drawn twice in two sizes. In your own view,
// free slots show as dashed plates while there is still an approved project to pin.
export function ProfilePins({ pins, freeSlots }: Readonly<{ pins: Pin[]; freeSlots: number }>) {
  if (pins.length === 0 && freeSlots === 0) return null;
  return (
    <section className="pf-prof-section" aria-labelledby="pinned-heading">
      <h2 id="pinned-heading">Pinned</h2>
      <ul className="pf-prof-pins">
        {pins.map((pin) => (
          <li key={pin.id}>
            <Link className="pf-prof-pin" href={`/dashboard/explore/${pin.id}`} data-track={pin.track ? pin.track.toLowerCase() : undefined}>
              <span className="pf-prof-pin-title">{pin.title}</span>
              <span className="pf-prof-pin-track">{pin.track ?? "No track"}</span>
              <span className="pf-prof-pin-foot">
                <span>{projectHours(pin.id).approved} H approved</span>
                {pin.openSource ? <span>Used by {pin.usedBy}</span> : null}
              </span>
            </Link>
          </li>
        ))}
        {Array.from({ length: freeSlots }, (_, index) => (
          <li key={`free-${index}`}>
            <div className="pf-prof-pin pf-prof-pin-empty">
              <span className="pf-prof-pin-title">Pin an approved project</span>
              <span className="pf-hint">Use Pin to profile on a project below.</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
