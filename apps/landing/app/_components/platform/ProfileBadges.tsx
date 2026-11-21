import { trackLevelCards } from "@/lib/platform/profile-view";
import { hoursForLevel, LEVEL_CAP, LEVEL_HOURS, sampleTrackHours } from "@/lib/platform/progress";
import "./profile.css";

// In the place of Stasis's Badges card (LOADOUT has no badges): the Track levels card. Four rows, one per track, each with its
// colour swatch, its level out of 20 and its approved hours. Levels and hours are public, so a visitor sees the same card.
// How far the builder is from their level to the next, as a percentage. The top level is full.
function levelFill(level: number, approved: number): number {
  if (level >= LEVEL_CAP) return 100;
  const from = hoursForLevel(level);
  const span = LEVEL_HOURS[level] - from;
  return span > 0 ? Math.min(100, Math.max(0, ((approved - from) / span) * 100)) : 0;
}

export function ProfileBadges() {
  const cards = trackLevelCards(sampleTrackHours);
  return (
    <section className="pf-sp-card" aria-labelledby="track-levels-heading">
      <h2 id="track-levels-heading">Track levels</h2>
      <ul className="pf-sp-levels">
        {cards.map((card) => (
          <li key={card.track} className="pf-sp-level" data-track={card.track.toLowerCase()}>
            <span className="pf-sp-level-swatch" aria-hidden="true" />
            <span className="pf-sp-level-name">{card.track}</span>
            <span className="pf-sp-level-lv">{card.label}</span>
            <span className="pf-sp-level-hours">{card.approved} h approved</span>
            <span className="pf-sp-level-bar" aria-hidden="true">
              <span style={{ width: `${levelFill(card.level, card.approved)}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
