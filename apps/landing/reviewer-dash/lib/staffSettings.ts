// Per-staff dashboard preferences. This file is plain data and parsing so the
// client settings menu can import it; the DB read/write is in lib/db.ts.
import { parseCustomReviewMacros, type CustomReviewMacro } from "./reviewMacros";

// Light and dark only. Pixl's editor themes (JetBrains, Cursor, Tokyo Night and the rest) are not offered here; "system" follows the site.
export const THEMES = ["system", "dark", "light"] as const;
// "theme" uses the theme's own accent (red for System, Dark and Light).
export const ACCENTS = ["theme", "red", "orange", "green", "cyan", "blue", "purple"] as const;

// The interface and code fonts. Pixl offers a picker; LOADOUT has one system stack and one code font, so each list has one entry
// (the Settings page no longer shows a Fonts section). The fields stay so a stored row still parses.
export const FONTS = ["system"] as const;
export const MONO_FONTS = ["jetbrains-mono"] as const;

export type Theme = (typeof THEMES)[number];
export type Accent = (typeof ACCENTS)[number];
export type Font = (typeof FONTS)[number];
export type MonoFont = (typeof MONO_FONTS)[number];

export const FONT_INFO: Record<Font, { label: string; note: string; css: string }> = {
  system: { label: "System", note: "Your OS font", css: "system-ui, sans-serif" },
};

export const MONO_FONT_INFO: Record<MonoFont, { label: string; note: string; css: string }> = {
  "jetbrains-mono": { label: "JetBrains Mono", note: "The code font", css: "var(--font-jetbrains-mono), monospace" },
};

export interface StaffSettings {
  theme: Theme;
  accent: Accent;
  font: Font;
  monoFont: MonoFont;
  compact: boolean;
  /** Confetti after a review. Off unless someone turns it on. */
  confetti: boolean;
  /** The short sound after a review. On unless someone turns it off. */
  sound: boolean;
  /** Width in px of the review page's right column (see ReviewSplit). */
  reviewPanelWidth: number;
  /** Show reviewer's name in verdict notifications by default. On unless turned off. */
  reviewRevealName: boolean;
  /** Ask to be notified by default when a ship you requested changes on is sent again. Off unless turned on. */
  reviewNotifyOnResubmit: boolean;
  /** Kept so a stored row parses. LOADOUT has no direct messages, so the Settings page no longer offers it. */
  reviewDms: boolean;
  /** Custom shortcuts, synced to this reviewer's account. */
  reviewMacros: CustomReviewMacro[];
  /** The optional first-time macro setup prompt was dismissed or a macro was saved. */
  reviewMacroPromptDismissed: boolean;
}

// What the settings page shows for each theme. The colours themselves live in app/_ui/themes.css; `preview` is only the little card
// in the picker.
export const THEME_INFO: Record<
  Theme,
  { label: string; note: string; preview: { bg: string; surface: string; text: string; primary: string } }
> = {
  system: {
    label: "System",
    note: "Follows the site's light or dark setting",
    preview: { bg: "#131418", surface: "#f9fafc", text: "#8492a6", primary: "#ec3750" },
  },
  dark: { label: "Dark", note: "Always dark", preview: { bg: "#131418", surface: "#17171d", text: "#f4f4f6", primary: "#ec3750" } },
  light: { label: "Light", note: "Always light", preview: { bg: "#f9fafc", surface: "#ffffff", text: "#1f2d3d", primary: "#ec3750" } },
};

export const DEFAULT_STAFF_SETTINGS: StaffSettings = {
  theme: "system",
  accent: "theme",
  font: "system",
  monoFont: "jetbrains-mono",
  compact: false,
  confetti: false,
  sound: true,
  reviewPanelWidth: 460,
  reviewRevealName: true,
  reviewNotifyOnResubmit: false,
  reviewDms: true,
  reviewMacros: [],
  reviewMacroPromptDismissed: false,
};

export const REVIEW_PANEL_MIN = 360;
export const REVIEW_PANEL_MAX = 1000;

export function clampReviewPanelWidth(raw: unknown): number {
  const n = typeof raw === "number" && Number.isFinite(raw) ? Math.round(raw) : DEFAULT_STAFF_SETTINGS.reviewPanelWidth;
  return Math.min(REVIEW_PANEL_MAX, Math.max(REVIEW_PANEL_MIN, n));
}

// Anything unknown or malformed falls back to the default for that field, so a
// stored row can never put the dashboard in a state the CSS doesn't know.
export function parseStaffSettings(raw: unknown): StaffSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    theme: THEMES.includes(r.theme as Theme) ? (r.theme as Theme) : DEFAULT_STAFF_SETTINGS.theme,
    accent: ACCENTS.includes(r.accent as Accent) ? (r.accent as Accent) : DEFAULT_STAFF_SETTINGS.accent,
    font: FONTS.includes(r.font as Font) ? (r.font as Font) : DEFAULT_STAFF_SETTINGS.font,
    monoFont: MONO_FONTS.includes(r.monoFont as MonoFont) ? (r.monoFont as MonoFont) : DEFAULT_STAFF_SETTINGS.monoFont,
    compact: r.compact === true,
    confetti: r.confetti === true,
    sound: r.sound !== false,
    reviewPanelWidth: clampReviewPanelWidth(r.reviewPanelWidth),
    reviewRevealName: r.reviewRevealName !== false,
    reviewNotifyOnResubmit: r.reviewNotifyOnResubmit === true,
    reviewDms: r.reviewDms !== false,
    reviewMacros: parseCustomReviewMacros(r.reviewMacros),
    reviewMacroPromptDismissed: r.reviewMacroPromptDismissed === true,
  };
}
