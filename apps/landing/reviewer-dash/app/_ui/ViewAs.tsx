"use client";

// Development only: switch the local test account without signing in. It sets the loadout_preview_role cookie that readViewer reads
// and reloads the page. The layout renders this only when local test accounts are on (localTestAccountsEnabled), which is never in
// production, and the server ignores the cookie otherwise. Not part of Pixl. See reviewer-dash/ADJUSTMENTS.md (R roles).
export type ViewAsOption = { key: string; label: string };

export default function ViewAs({ options, current }: { options: readonly ViewAsOption[]; current: string }) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="hc-muted hidden xl:inline">View as</span>
      <select
        className="hc-input"
        style={{ width: "auto", minHeight: 0, height: 32, paddingBlock: 0, paddingInline: 8, fontSize: 13, maxWidth: 140 }}
        value={current}
        aria-label="View the reviewer site as a test account (development only)"
        onChange={(event) => {
          document.cookie = `loadout_preview_role=${encodeURIComponent(event.target.value)}; path=/; SameSite=Lax`;
          window.location.assign("/");
        }}
      >
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
