"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LOADOUT_HELP_URL, siteConfig } from "../site-config";
import { useDisplayPreferences, type ColorVisionProfile } from "./display-preferences";
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
    const body = dialog.querySelector<HTMLElement>(".a11y-dialog-body");
    if (body) body.scrollTop = 0;
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
            <h2 id="a11y-dialog-title" data-dialog-title tabIndex={-1} aria-label="Accessibility settings">
              <span className="a11y-title-full">Accessibility</span>
              <span className="a11y-title-compact" aria-hidden="true">Settings</span>
            </h2>
            <button className="a11y-close" type="button" aria-label="Close" onClick={() => dialogRef.current?.close()}>
              <span className="a11y-close-label">Close</span><span className="a11y-close-icon" aria-hidden="true">×</span>
            </button>
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
  const [retracted, setRetracted] = useState(false);

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

  useEffect(() => {
    const phone = window.matchMedia("(max-width: 560px)");
    const docsMain = document.querySelector<HTMLElement>(".docs-main");
    const scrollTarget: HTMLElement | Window = docsMain ?? window;
    const scrollPosition = () => scrollTarget === window ? window.scrollY : (scrollTarget as HTMLElement).scrollTop;
    let last = scrollPosition();
    let frame = 0;
    const updateForViewport = () => {
      last = scrollPosition();
      const tab = tabRef.current;
      const heldOpen = tab?.contains(document.activeElement) || document.querySelector(".a11y-dialog[open]");
      setRetracted(phone.matches && last > 120 && !heldOpen);
    };
    const onScroll = () => {
      if (!phone.matches || frame) return;
      frame = requestAnimationFrame(() => {
        const y = scrollPosition();
        const tab = tabRef.current;
        const heldOpen = Boolean(tab?.contains(document.activeElement) || document.querySelector(".a11y-dialog[open]"));
        if (heldOpen || y <= 120 || y < last - 4) setRetracted(false);
        else if (y > last + 4) setRetracted(true);
        last = y;
        frame = 0;
      });
    };
    phone.addEventListener("change", updateForViewport);
    window.addEventListener("resize", updateForViewport);
    scrollTarget.addEventListener("scroll", onScroll, { passive: true });
    updateForViewport();
    return () => {
      phone.removeEventListener("change", updateForViewport);
      window.removeEventListener("resize", updateForViewport);
      scrollTarget.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="a11y-shortcut" data-retracted={retracted} ref={tabRef} onFocusCapture={() => setRetracted(false)}>
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

const colorProfiles: { value: ColorVisionProfile; label: string; description: string }[] = [
  { value: "standard", label: "Standard", description: "LOADOUT's usual colors." },
  { value: "protanopia", label: "Protanopia", description: "For protanopia or protanomaly. Blue and amber accents." },
  { value: "deuteranopia", label: "Deuteranopia", description: "For deuteranopia or deuteranomaly. Blue and orange accents." },
  { value: "tritanopia", label: "Tritanopia", description: "For tritanopia or tritanomaly. Warm sprites, native cursor, distinct brightness and underlined links." },
  { value: "achromatopsia", label: "Achromatopsia", description: "For achromatopsia or monochromacy. Grayscale sprites and accents, native cursor and underlined links." },
];

function ColorVisionSetting({ value, change }: { value: ColorVisionProfile; change: (value: ColorVisionProfile) => void }) {
  const hint = useId();
  const profile = colorProfiles.find((entry) => entry.value === value) ?? colorProfiles[0];
  return <label className="a11y-option a11y-palette-option">
    <span className="a11y-option-copy"><strong>Color vision</strong><small id={hint}>{profile.description}</small></span>
    <span className="a11y-select-wrap">
      <select aria-label="Color vision palette" aria-describedby={hint} value={value} onChange={(event) => change(event.currentTarget.value as ColorVisionProfile)}>
        {colorProfiles.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
      </select>
    </span>
  </label>;
}

function subscribeSettingsViewport(listener: () => void) {
  const viewport = window.matchMedia("(min-width: 821px)");
  viewport.addEventListener("change", listener);
  return () => viewport.removeEventListener("change", listener);
}

function hasSettingsRail() {
  return window.matchMedia("(min-width: 821px)").matches;
}

type SettingsCategory = { title: string; content: ReactNode };
type CategoryNavigation = { count: number; horizontal: boolean; select: (index: number) => void };

function createSettingsCategories(
  preferences: ReturnType<typeof useDisplayPreferences>,
  setPreference: ReturnType<typeof useDisplayPreferences>["setPreference"],
  deviceReducedMotion: boolean,
): SettingsCategory[] {
  return [
    { title: "Appearance", content: <>
      <ToggleSetting title="Light mode" description="Switch from graphite to stone paper." checked={preferences.theme === "light"} change={(value) => preferences.setTheme(value ? "light" : "dark")} />
      <ColorVisionSetting value={preferences.colorVision} change={preferences.setColorVision} />
      <ToggleSetting title="Stronger contrast" description="Add contrast to text, borders and focus indicators. Your device's higher-contrast setting is also respected." checked={preferences.strongContrast} change={(value) => setPreference("strongContrast", value)} />
      <ToggleSetting title="Larger controls" description="Give compact navigation, buttons and footer links a larger 44px target." checked={preferences.largerControls} change={(value) => setPreference("largerControls", value)} />
      <ToggleSetting title="Use system cursor" description="Use your device's normal pointer instead of LOADOUT's pixel cursor." checked={preferences.systemCursor} change={(value) => setPreference("systemCursor", value)} />
    </> },
    { title: "Reading", content: <>
      <ToggleSetting title="Phantom Sans" description="Switch the page to Pixl's Phantom Sans font. Turn it off to return to LOADOUT's usual fonts." checked={preferences.phantomSans} change={(value) => setPreference("phantomSans", value)} />
      <ChoiceSetting title="Reading text size" description="Enlarge article text, descriptions and settings up to 200%. Browser zoom still works for the whole page." value={String(preferences.readingSize)} choices={[{ value: "100", label: "Default" }, { value: "125", label: "125%" }, { value: "150", label: "150%" }, { value: "200", label: "200%" }]} change={(value) => setPreference("readingSize", Number(value) as 100 | 125 | 150 | 200)} />
      <ToggleSetting title="More text spacing" description="Add space between lines, paragraphs and letters." checked={preferences.moreSpacing} change={(value) => setPreference("moreSpacing", value)} />
      <ToggleSetting title="Underline links" description="Keep text links underlined so they're easier to spot." checked={preferences.underlineLinks} change={preferences.setUnderlineLinks} />
    </> },
    { title: "Effects", content: <>
      <ToggleSetting title="Reduce motion" description="Stop animations. Your device's reduced-motion preference always takes priority." checked={preferences.reduceMotion} change={preferences.setReduceMotion} />
      {deviceReducedMotion && <p className="a11y-device-note">Your device currently requests reduced motion, so animations stay off even when the switch is off.</p>}
      <ChoiceSetting title="Grain texture" description="Choose animated grain, a still texture or no grain." value={preferences.grain} choices={[{ value: "animated", label: "Animated" }, { value: "still", label: "Still" }, { value: "off", label: "Off" }]} change={(value) => setPreference("grain", value as "animated" | "still" | "off")} />
      <ToggleSetting title="Hide background grid" description="Remove the engineering-paper grid behind the page." checked={preferences.hideGrid} change={(value) => setPreference("hideGrid", value)} />
      <ToggleSetting title="Hide ASCII drawings" description="Remove the decorative ASCII drawings around the page." checked={preferences.hideAscii} change={(value) => setPreference("hideAscii", value)} />
      <ToggleSetting title="Hide mascot" description="Hide Orry and stop his animations and interactions." checked={preferences.hideMascot} change={(value) => setPreference("hideMascot", value)} />
      <ToggleSetting title="Hide extra markings" description="Remove stamps, side labels, the footer wordmark and depth lighting." checked={preferences.hideMarkings} change={(value) => setPreference("hideMarkings", value)} />
      <ToggleSetting title="Native scrolling" description="Use normal browser scrolling without the smooth-scroll effect." checked={preferences.nativeScroll} change={(value) => setPreference("nativeScroll", value)} />
    </> },
  ];
}

function categoryIndexForKey(key: string, index: number, { count, horizontal }: CategoryNavigation) {
  const forward = horizontal ? "ArrowRight" : "ArrowDown";
  const backward = horizontal ? "ArrowLeft" : "ArrowUp";
  if (key === forward) return (index + 1) % count;
  if (key === backward) return (index + count - 1) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

function navigateCategory(event: KeyboardEvent<HTMLButtonElement>, index: number, navigation: CategoryNavigation) {
  const next = categoryIndexForKey(event.key, index, navigation);
  if (next === null) return;
  event.preventDefault();
  navigation.select(next);
  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
}

function CategoryTabs({ categories, activeCategory, groupName, spacious, select }: {
  categories: SettingsCategory[]; activeCategory: number; groupName: string; spacious: boolean; select: (index: number) => void;
}) {
  const navigation = { count: categories.length, horizontal: spacious, select };
  return <div className="a11y-category-rail" role="tablist" aria-label="Settings categories" aria-orientation={spacious ? "horizontal" : "vertical"}>
    {categories.map((category, index) => <button key={category.title} type="button" role="tab" id={`${groupName}-tab-${index}`} aria-controls={`${groupName}-panel-${index}`} aria-selected={activeCategory === index} tabIndex={activeCategory === index ? 0 : -1} onClick={() => select(index)} onKeyDown={(event) => navigateCategory(event, index, navigation)}>
      <span aria-hidden="true">0{index + 1}</span>{category.title}
    </button>)}
  </div>;
}

function CategoryPanels({ categories, showRail, activeCategory, groupName, layout, select }: {
  categories: SettingsCategory[]; showRail: boolean; activeCategory: number; groupName: string; layout: "compact" | "page"; select: (index: number) => void;
}) {
  return <div className="a11y-category-content">{categories.map((category, index) => {
    if (showRail) return <section key={category.title} className="a11y-category-panel" role="tabpanel" id={`${groupName}-panel-${index}`} aria-labelledby={`${groupName}-tab-${index}`} hidden={activeCategory !== index} tabIndex={0}>
      <h2>{category.title}</h2>
      <div className="a11y-group-body">{category.content}</div>
    </section>;
    return <details key={category.title} className="a11y-settings-group" name={groupName} open={index === (layout === "page" ? activeCategory : 0)} onToggle={(event) => {
      if (layout === "page" && event.currentTarget.open) select(index);
    }}>
      <summary aria-label={category.title}><span className="a11y-category-title">{category.title === "Appearance" ? <>Appear<wbr />ance</> : category.title}</span><span className="a11y-group-mark" aria-hidden="true" /></summary>
      <div className="a11y-group-body">{category.content}</div>
    </details>;
  })}</div>;
}

export function AccessibilitySettings({ layout = "compact" }: { layout?: "compact" | "page" }) {
  const preferences = useDisplayPreferences();
  const { reduced: deviceReducedMotion } = useMotionPreference();
  const [status, setStatus] = useState("");
  const groupName = useId();
  const [activeCategory, setActiveCategory] = useState(0);
  const wideViewport = useSyncExternalStore(subscribeSettingsViewport, hasSettingsRail, () => false);
  const showRail = layout === "page" && wideViewport;
  const { setPreference } = preferences;
  const spacious = preferences.moreSpacing || preferences.readingSize !== 100;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!active?.closest(".a11y-dialog[open]")) return;
      active.closest(".a11y-option, .a11y-choice")?.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [preferences.readingSize, preferences.moreSpacing, preferences.phantomSans]);
  const categories = createSettingsCategories(preferences, setPreference, deviceReducedMotion);

  return <section className={`a11y-settings${layout === "page" ? " a11y-page-settings" : ""}`} aria-label="Display preferences" onChangeCapture={() => setStatus("")}>
    <p className="a11y-save-note">Changes apply immediately and save in this browser.</p>
    <div className={showRail ? "a11y-settings-layout" : undefined}>
      {showRail && <CategoryTabs categories={categories} activeCategory={activeCategory} groupName={groupName} spacious={spacious} select={setActiveCategory} />}
      <CategoryPanels categories={categories} showRail={showRail} activeCategory={activeCategory} groupName={groupName} layout={layout} select={setActiveCategory} />
    </div>
    <button type="button" className="a11y-reset" aria-label="Reset display settings" onClick={() => { preferences.reset(); setStatus("Display settings reset. Your device's reduced-motion and contrast preferences still apply."); }}>
      <span className="a11y-reset-full">Reset display settings</span><span className="a11y-reset-compact" aria-hidden="true">Reset</span>
    </button>
    <p className="a11y-reset-status" role="status">{status}</p>
  </section>;
}
