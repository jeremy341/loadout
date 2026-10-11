# Reference background

**Status:** Approved for local implementation. No commit or publication requested.

## Scope

Copy background paint and decorative motifs from the supplied `Loadout – Redesign.html` for the homepage's existing light/dark themes. Remove the former clouds, random pixel fragments, outside yellow slashes, approximate ASCII drawings, and duplicate grain from the rendered homepage; preserve their asset files. Retain the current program content and section geometry.

## Source values

- Paper is `#DDD3BF` in light mode and `#141210` in dark mode.
- Use exactly two 40px grid layers, with coal lines at 8% opacity in light mode and cream lines at 6% opacity in dark mode. Remove the extra 200px guide.
- Copy the grain filter: fractal noise, frequency 0.8, three octaves, stitched tiles; color matrix `0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 1.1 -0.35`. Light opacity 0.34/multiply; dark 0.32/screen.
- Copy vertical strata shading from transparent through the first 8% of the sheet to `rgba(40,25,10,.28)` at the bottom in light mode or `rgba(0,0,0,.4)` in dark mode.
- The reference sheet is at most 1440px wide, centered, with flat canvas outside. Keep this as a background boundary rather than changing article widths.
- Copy the top 12px measurement ticks, right 48px ruler with 12px minor/96px major ticks, and decorative scroll-linked depth marker. Depth numbers are an aesthetic scroll ruler, not participant or Era progress.
- Copy the two source ASCII drawings and their three hover frames. Use the source ember positions, sizes, timing, and drift; light specks take twice as long and have no glow, dark embers use the source warm glow.

## Hero decorations

Place the source ASCII drawings at the lower corners of the hero's sheet bounds, replacing the old drawings. Match the source's brackets, dashed frame, and three plus marks. Use the rough-edged Glück auf stamp with a factual subtitle (`BUILD · SHIP · UPGRADE`) rather than copying an unverified historical date. Decorations adapt around LOADOUT's existing hero layout; hide them when there is insufficient room. Do not add the reference's intro overlay, fake level sections, scheduled shifts, or verification claims.

## Component handoff

`PaperScenery` renders `.reference-backdrop` containing `.reference-sheet`, `.reference-grain`, `.reference-strata`, `.reference-top-ticks`, and `.reference-ruler`. The ruler contains `.reference-ruler-fill`, `.reference-depth-readout`/`.reference-depth-label`, four numbered labels, and `.reference-ruler-marker`.

`HeroBackdrop` renders `.hero-reference-background` with `.reference-embers` and 22 `<i>` specks (`--ember-time`, `--ember-dx`, negative `animationDelay`). Its `.hero-background-frame` contains two `.reference-corner` elements, three `.reference-plus` marks, `.reference-stamp`, and `.reference-ascii-left`/`right`. Each ASCII drawing contains three overlapping `.reference-ascii-frame` `<pre>` elements and a hover caption. Use source values from `.tmp/background-reference/style-1.css` and `page-1.html` as evidence; those files are task scratch, not canonical documentation.

The engineering CSS owner writes only `apps/landing/app/redesign-background.css`, loaded after the foundation/theme sheets. The root integration owns the components and import. Decorative nodes are aria-hidden and cannot block links. No raster assets or new dependencies.

## Accessibility and verification

Keep the native theme toggle, keyboard focus, and mobile menu intact. Hide the right ruler below 1000px and ASCII/stamps below 800px or on short crowded viewports. Reduced motion removes ember travel, ASCII cycling, and scroll-driven ornament movement while leaving a static background. Check both themes at desktop/mobile sizes, including overflow, readable content, functioning theme persistence, and the production build.
