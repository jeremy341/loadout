"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { landingHref } from "../../../lib/landing";
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY, parseTheme, type Theme } from "../../../lib/theme";
import { PageHeader, Panel, PreviewNote, Status, Tabs, Tag } from "../../ui/ui";
import { ConnectionsTab } from "./account-connections";
import { DataTab } from "./account-data";
import { VerificationTab } from "./account-verification";
import { navLead } from "./data";
import { VISIBILITY_LABELS, type Visibility } from "./logic/profile";
import { CheckRow, useAnnounce } from "./shared";
import { useProfile } from "./state";

// Account: verification, privacy, connections, data and display. Four of the five tabs are simulated or local to
// this browser, and each says so.

export function AccountPage() {
  const [message, announce] = useAnnounce();
  return (
    <>
      <PageHeader eyebrow="You" title="Account" lead={navLead("account")} />
      <PreviewNote>There is no sign-in yet. Verification and connections are simulated, and everything else is saved only in this browser.</PreviewNote>
      <Status message={message} />
      <Tabs
        label="Account sections"
        tabs={[
          { id: "verification", label: "Verification", panel: <VerificationTab announce={announce} /> },
          { id: "privacy", label: "Privacy", panel: <PrivacyTab announce={announce} /> },
          { id: "connections", label: "Connections", panel: <ConnectionsTab announce={announce} /> },
          { id: "data", label: "Data", panel: <DataTab announce={announce} /> },
          { id: "display", label: "Display", panel: <DisplayTab announce={announce} /> },
        ]}
      />
    </>
  );
}

// ---- Privacy ----------------------------------------------------------------------------------------------

function PrivacyTab({ announce }: { announce: (message: string) => void }) {
  const { profile, setVisibility } = useProfile();
  return (
    <div className="pg-stack">
      <Panel title="Public by default">
        <p>The program is built in the open, so what you ship is public unless a rule says otherwise.</p>
        <ul className="hb-plain hb-rules">
          <li>
            <Tag tone="ok">Public</Tag> Ships, project pages and journals are public by default.
          </li>
          <li>
            <Tag>Reviewers only</Tag> Lapse recordings for Hardware projects are visible only to reviewers. You cannot make them public.
          </li>
          <li>
            <Tag>Your choice</Tag> A specific attachment that is not a Lapse recording can be kept private to reviewers while the project page and journal stay
            public. You set that on the attachment in Projects.
          </li>
          <li>
            <Tag tone="warn">Never publish</Tag> API keys, credentials, private addresses or other personal information.
          </li>
        </ul>
      </Panel>

      <Panel title="What your profile shows">
        <p className="mut">These are the same switches as on your Profile. Changing one here changes it there, and each saves as you change it.</p>
        <fieldset className="hb-fieldset">
          <legend className="sr-only">Sections shown on your public profile</legend>
          {(Object.keys(VISIBILITY_LABELS) as (keyof Visibility)[]).map((key) => (
            <CheckRow
              key={key}
              label={`Show my ${VISIBILITY_LABELS[key].label.toLowerCase()}`}
              help={VISIBILITY_LABELS[key].help}
              checked={profile.visibility[key]}
              onChange={(checked) => {
                setVisibility(key, checked);
                announce(`${VISIBILITY_LABELS[key].label} are now ${checked ? "shown on" : "hidden from"} your public profile.`);
              }}
            />
          ))}
        </fieldset>
        <p>
          <Link href="/profile" className="btn btn-quiet btn-sm">
            See your public view
          </Link>
        </p>
      </Panel>

      <Panel title="Rankings">
        <p>
          Whether you appear on public rankings is a setting in <Link href="/leaderboards">Leaderboards</Link>, so it lives next to the boards it changes.
        </p>
      </Panel>
    </div>
  );
}

// ---- Display ----------------------------------------------------------------------------------------------

// The theme toggle in the top rail listens for this event, so a change here keeps it in step. Same key and attribute.
const THEME_EVENT = "loadout-theme-change";

function subscribeTheme(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const themeSnapshot = (): Theme => parseTheme(document.documentElement.getAttribute(THEME_ATTRIBUTE));
const themeServerSnapshot = (): Theme => "dark";

function DisplayTab({ announce }: { announce: (message: string) => void }) {
  const theme = useSyncExternalStore(subscribeTheme, themeSnapshot, themeServerSnapshot);

  function choose(next: Theme) {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked. The choice still applies for this visit.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
    announce(`${next === "light" ? "Light" : "Dark"} theme on.`);
  }

  return (
    <div className="pg-stack">
      <Panel title="Theme">
        <p className="mut">Dark is the default. Your choice is remembered in this browser under the same setting the public site uses.</p>
        <fieldset className="hb-fieldset">
          <legend className="fld-label">Colour theme</legend>
          <div className="hb-radios">
            {(["dark", "light"] as const).map((option) => (
              <label key={option} className="hb-radio">
                <input type="radio" name="hb-theme" value={option} checked={theme === option} onChange={() => choose(option)} />
                <span>{option === "dark" ? "Dark (graphite)" : "Light (stone paper)"}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </Panel>

      <Panel title="Accessibility">
        <p>
          Reading size, colour-vision palettes, stronger contrast, reduced motion and the other display choices are set on the public site&apos;s Accessibility page. This
          platform follows your device&apos;s reduced-motion and high-contrast settings on its own.
        </p>
        <p>
          <a className="btn btn-quiet btn-sm" href={landingHref("/accessibility")}>
            Open accessibility settings
            <span className="sr-only"> (public site, leaves the platform)</span>
          </a>
        </p>
      </Panel>
    </div>
  );
}
