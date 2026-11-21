# Not-connected placeholders and Hardware funding card

Brief written 16 Nov 2026; not reviewed by the owner. Binds to DESIGN.md and the existing `.pf` platform tokens.

Surfaces: signed-out platform page, Settings account section, project page Hackatime box, and (Hardware projects only) a Bill of materials plus Hardware funding row.

Components: `ConnectionPlaceholder` (name, status, reason, optional disabled controls) and `HardwareFunding`. Dashed frame, pixel name, one status tag, one plain sentence. No data, no network, nothing saved.

States: not connected only. The funding checkbox and amount field are disabled with the reason shown beneath; the Ore line uses `USD_PER_TEN_ORE` and rounds up.

Responsive: single column under 900px; buttons wrap inside the block. Accessibility: group role with a label, native disabled controls, labelled amount field described by the Ore and status lines, tokens keep contrast in all themes. No motion added.

Acceptance: copy matches the task text, no dashes as punctuation, 1440 and 390 screenshots clean.
