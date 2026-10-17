import type { CSSProperties, ReactNode } from "react";
import { ThemeSwitch } from "../ThemeSwitch";
import { NoiseGrain } from "../NoiseGrain";
import { DepthGlow } from "./DepthGlow";
import { DepthNumeral } from "./DepthNumeral";
import { SiteNav } from "./SiteNav";

type Variant = "lost" | "cave-in";

const COPY: Record<Variant, { tag: string; lines: [string, string]; depth: number }> = {
  lost: { tag: "SOHLE · ERROR 404", lines: ["Sorry, you’ve hit", "rock bottom."], depth: 1404 },
  "cave-in": { tag: "EINSTURZ · CAVE-IN", lines: ["Something", "caved in."], depth: 500 },
};

// Ore flecks in the rock: left (%) and top (%) of each small cluster. They keep to the edges, away from the text.
const FLECKS = [[5, 18], [14, 30], [9, 46], [7, 70], [18, 86], [30, 91], [43, 93], [58, 92], [71, 88], [84, 84], [93, 66], [89, 42], [95, 20]] as const;

// The bottom level of the mine: a wrong address (404) and a failed render (cave-in) share it, and it fits one screen.
// The whole page is the rock face (a depth marker as big as the window): the depth numeral sits behind the copy and
// falls to its number when the page opens (DepthNumeral), and a miner's lamp, which starts in the middle and follows a
// fine pointer, lights the hatching, the numeral and the ore flecks. The hero's classes carry the tag, the title, the
// copy and the buttons.
export function RockBottom({ variant, lead, actions }: { variant: Variant; lead: ReactNode; actions: ReactNode }) {
  const copy = COPY[variant];
  return (
    <div className={`home rb-page rb-${variant}`} id="top">
      <a className="skip-link" href="#main">Skip to content</a>
      <DepthGlow />
      <NoiseGrain />
      <div className="pit rb-rock" aria-hidden="true">
        <DepthNumeral depth={copy.depth} />
        <div className="rb-ore">
          {FLECKS.map(([left, top]) => (
            <i key={left} style={{ left: `${left}%`, top: `${top}%` } as CSSProperties} />
          ))}
        </div>
      </div>
      <div className="in">
        <SiteNav anchorBase="/" />
        <main id="main">
          <ThemeSwitch />
          <div className="hero rb">
            <div className="hero-badge">
              <span className="sl" aria-hidden="true" />
              <span className="tag">{copy.tag}</span>
              <span className="sl sl-flip" aria-hidden="true" />
            </div>
            <div className="hero-frame">
              <h1 className="h1">
                <span>{copy.lines[0]}</span>{" "}<span>{copy.lines[1]}</span>
              </h1>
              <p>{lead}</p>
            </div>
            <div className="hero-actions">{actions}</div>
          </div>
        </main>
        <footer className="rb-foot"><p><span lang="de">Glück auf!</span> <span>LOADOUT, Revier edition</span></p></footer>
      </div>
    </div>
  );
}
