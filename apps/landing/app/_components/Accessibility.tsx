"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LOADOUT_HELP_URL, siteConfig } from "../site-config";
import { useDisplayPreferences } from "./display-preferences";
import { useMotionPreference } from "./motion-preference";

type AccessibilityContextValue = {
  openDialog: (opener: HTMLElement) => void;
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const backdropPointer = useRef<number | null>(null);

  function outside(event: PointerEvent<HTMLDialogElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  }

  function openDialog(opener: HTMLElement) {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    openerRef.current = opener;
    dialog.showModal();
    dialog.scrollTop = 0;
    dialog.querySelector<HTMLElement>("[data-dialog-title]")?.focus({ preventScroll: true });
  }

  function returnFocus() {
    openerRef.current?.focus();
    openerRef.current = null;
  }

  function containFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const dialog = event.currentTarget;
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]',
    )).filter((element) => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    const active = document.activeElement;
    const atStart = active === first || active === dialog.querySelector("[data-dialog-title]");
    const wrapsBackward = event.shiftKey && atStart;
    const wrapsForward = !event.shiftKey && active === last;
    if (wrapsBackward) {
      event.preventDefault();
      last.focus();
    } else if (wrapsForward) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <AccessibilityContext.Provider value={{ openDialog }}>
      {children}
      <dialog
        ref={dialogRef}
        className="a11y-dialog"
        data-lenis-prevent
        aria-labelledby="a11y-dialog-title"
        onClose={returnFocus}
        onKeyDown={containFocus}
        onPointerDown={(event) => { backdropPointer.current = outside(event) ? event.pointerId : null; }}
        onPointerUp={(event) => {
          if (backdropPointer.current === event.pointerId && outside(event)) event.currentTarget.close();
          backdropPointer.current = null;
        }}
        onPointerCancel={() => { backdropPointer.current = null; }}
      >
        <div className="a11y-dialog-header">
          <p className="a11y-kicker">LOADOUT / FIELD SETTINGS</p>
          <div className="a11y-dialog-head">
            <h2 id="a11y-dialog-title" data-dialog-title tabIndex={-1} aria-label="Accessibility settings">Accessibility<span className="a11y-title-extra"> settings</span></h2>
            <button className="a11y-close" type="button" onClick={() => dialogRef.current?.close()}>Close</button>
          </div>
        </div>
        <div className="a11y-dialog-body">
          <AccessibilitySettings />
          <div className="a11y-dialog-footer">
            <a href="/accessibility">Full accessibility page</a>
            <span>Need help? <a href={LOADOUT_HELP_URL}>#loadout-help</a> or <a href={siteConfig.githubUrl}>GitHub</a>.</span>
          </div>
        </div>
      </dialog>
    </AccessibilityContext.Provider>
  );
}

export function AccessibilityLink({ className, children = "Accessibility", label }: { className?: string; children?: ReactNode; label?: string }) {
  const context = useContext(AccessibilityContext);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const modified = [event.metaKey, event.ctrlKey, event.shiftKey, event.altKey].some(Boolean);
    if (!context) return;
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (modified) return;
    if (event.currentTarget.target === "_blank") return;
    event.preventDefault();
    context.openDialog(event.currentTarget);
  }

  return <a className={className} aria-label={label} href="/accessibility" onClick={handleClick}>{children}</a>;
}

export function AccessibilityTab() {
  const tabRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const tab = tabRef.current;
    if (!tab) return;
    // Use the bar's layout height, not its animated position when scrolling.
    const nav = document.querySelector<HTMLElement>(".home .nav");
    if (!nav) { tab.style.removeProperty("--a11y-tab-top"); return; }
    const position = () => tab.style.setProperty("--a11y-tab-top", `${nav.offsetTop + nav.offsetHeight + 12}px`);
    position();
    const observer = new ResizeObserver(position);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <div className="a11y-shortcut" ref={tabRef}>
      <AccessibilityLink className="a11y-tab" label="Open accessibility settings">ACCESSIBILITY</AccessibilityLink>
    </div>
  );
}

type ToggleProps = { title: string; description: string; checked: boolean; change: (value: boolean) => void };
function ToggleSetting({ title, description, checked, change }: ToggleProps) {
  const id = useId();
  return <label className="a11y-option">
    <span className="a11y-option-copy"><strong>{title}</strong><small id={id}>{description}</small></span>
    <span className="a11y-switch">
      <input type="checkbox" aria-label={title} aria-describedby={id} checked={checked} onChange={(event) => change(event.currentTarget.checked)} />
      <span aria-hidden="true">{checked ? "ON" : "OFF"}</span>
    </span>
  </label>;
}
function ChoiceSetting({ title, description, value, choices, change }: {
  title: string; description: string; value: string; choices: { value: string; label: string }[]; change: (value: string) => void;
}) {
  const id = useId();
  return <fieldset className="a11y-choice" aria-describedby={`${id}-hint`}>
    <legend>{title}</legend>
    <p id={`${id}-hint`}>{description}</p>
    <div className="a11y-choice-options">{choices.map((choice) => <label key={choice.value}>
      <input type="radio" name={id} value={choice.value} checked={value === choice.value} onChange={() => change(choice.value)} />
      <span>{choice.label}</span>
    </label>)}</div>
  </fieldset>;
}
export function AccessibilitySettings() {
  const preferences = useDisplayPreferences();
  const { reduced: deviceReducedMotion } = useMotionPreference();
  const [status, setStatus] = useState("");
  const { setPreference } = preferences;
  return <section className="a11y-settings" aria-label="Display preferences" onChangeCapture={() => setStatus("")}>
    <p>Changes apply immediately across LOADOUT and are saved in this browser when storage is available.</p>
    <fieldset className="a11y-settings-group">
      <legend>Appearance</legend>
      <ToggleSetting title="Light mode" description="Switch from graphite to stone paper." checked={preferences.theme === "light"} change={(value) => preferences.setTheme(value ? "light" : "dark")} />
      <ToggleSetting title="Color-safe palette" description="Use blue and orange accents." checked={preferences.colorSafe} change={preferences.setColorSafe} />
      <ToggleSetting title="Stronger contrast" description="Strengthen text, borders and focus indicators in both themes." checked={preferences.strongContrast} change={(value) => setPreference("strongContrast", value)} />
      <ToggleSetting title="Use system cursor" description="Use your device's normal pointer instead of LOADOUT's pixel cursor." checked={preferences.systemCursor} change={(value) => setPreference("systemCursor", value)} />
    </fieldset>
    <fieldset className="a11y-settings-group">
      <legend>Reading</legend>
      <ToggleSetting title="Plain typography" description="Use a standard font for headings and controls instead of pixel lettering." checked={preferences.plainTypography} change={(value) => setPreference("plainTypography", value)} />
      <ChoiceSetting title="Reading text size" description="Enlarge article text, descriptions and settings. Browser zoom still works for the whole page." value={String(preferences.readingSize)} choices={[{ value: "100", label: "Default" }, { value: "125", label: "125%" }, { value: "150", label: "150%" }]} change={(value) => setPreference("readingSize", Number(value) as 100 | 125 | 150)} />
      <ToggleSetting title="More text spacing" description="Add space between lines, paragraphs and letters." checked={preferences.moreSpacing} change={(value) => setPreference("moreSpacing", value)} />
      <ToggleSetting title="Underline links" description="Keep text links underlined so they're easier to spot." checked={preferences.underlineLinks} change={preferences.setUnderlineLinks} />
    </fieldset>
    <fieldset className="a11y-settings-group">
      <legend>Effects</legend>
      <ToggleSetting title="Reduce motion" description="Stop animations. Your device's reduced-motion preference always takes priority." checked={preferences.reduceMotion} change={preferences.setReduceMotion} />
      {deviceReducedMotion && <p className="a11y-device-note">Your device currently requests reduced motion, so animations stay off even when the switch is off.</p>}
      <ChoiceSetting title="Grain texture" description="Reduced motion makes animated grain still. Simplify decoration removes it altogether." value={preferences.grain} choices={[{ value: "animated", label: "Animated" }, { value: "still", label: "Still" }, { value: "off", label: "Off" }]} change={(value) => setPreference("grain", value as "animated" | "still" | "off")} />
      <ToggleSetting title="Simplify decoration" description="Hide grain, the background grid, decorative ASCII and wandering mascots. Useful diagrams and prize images stay." checked={preferences.simplifyDecoration} change={(value) => setPreference("simplifyDecoration", value)} />
      <ToggleSetting title="Native scrolling" description="Use normal browser scrolling without the smooth-scroll effect." checked={preferences.nativeScroll} change={(value) => setPreference("nativeScroll", value)} />
    </fieldset>
    <button type="button" className="a11y-reset" onClick={() => { preferences.reset(); setStatus("Display settings reset. Your device's reduced-motion preference still applies."); }}>Reset display settings</button>
    <p className="a11y-reset-status" role="status">{status}</p>
  </section>;
}
