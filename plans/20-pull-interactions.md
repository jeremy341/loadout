# Plan 20: Pull interactions (grab cursor, pull tab, pull cord)

**Status:** Dropped by the owner on 2026-10-15. The grab cursors, the pull tab (first on a rope, then a rubber band, then a rope again) and the pull cord were all tried, and the owner removed the pull interaction from the Docs tab completely: it is a plain link again, and nothing of the gesture remains in the code. The open hand and the fist are still used, for the mole. This file keeps the idea and the reasons for the record.
**Owner:** This plan owns the pull interactions. Plan 06 owns the homepage they sit on, and the design system owns the cursor and motion rules.

## 1. The idea

Add one playful gesture to the homepage: **things you can grab and pull, which snap back**.

1. A **grab cursor**: the open hand over something pullable, and the closed fist while you pull it. Kenney's pack, already in use for the arrow and the hand, has both.
2. A **pull tab**: the floating "LOADOUT DOCS" tab at the bottom of the screen can be dragged up like a tab on a cord. It stretches, and when you let go it springs back. If you pull far enough it opens the Docs.
3. A **pull cord** (later, optional): a cord with a ring hangs at the very bottom of the footer, at the deepest point of the page. Pull it up far enough and a hidden level opens, "−1404 M, Sohle", the depth of the 404 page. Let go too early and it snaps back.

## 2. Does it make sense?

**Yes, as a small extra, not a feature.**

- **It fits the site.** The page is a descent through a mine, and the 404 says "The only way back is up." Pulling a cord or a tab up is the same direction and the same story, like hauling a mine lift. The Docs tab already sits attached to the bottom edge, so pulling it up feels natural.
- **It is memorable and cheap.** It is one small client component, pointer events and one transform. It gives the grab cursor a reason to exist.
- **But it is delight, not substance.** The reviewer's feedback was about missing details and an AI-written feel. A gimmick doesn't fix that. This should not be built before the economy decisions and the real examples and numbers (Plan 19). It is a good next job when those are waiting on the owner.
- **It must not trap anyone.** A drag gesture is hard for some people, and a hidden secret must not hide anything needed. So everything keeps a plain alternative.

**Recommendation:** build phase 1 (cursor and pull tab) first. Treat phase 2 (the cord and the secret) as optional, and only if phase 1 feels good.

**Why a cord, not "pull the page up".** The first idea was to pull the page itself beyond its bottom (overscroll). That is risky: it fights native scrolling and the Lenis smooth scroll, behaves differently on iOS, Android and desktop (a mouse wheel can't overscroll), and gives no visible hint that it is possible. A visible handle, a ring on a cord, avoids all of that: the gesture only starts on the handle, scrolling is never touched, and the affordance is obvious.

## 3. Phase 1: grab cursor and pull tab

**Changed after the owner's review (2026-10-15):** the first version lifted the tab on a dashed rope. A second version turned it into a blue rubber band that thinned as it stretched; the owner preferred the rope, so the rope is back. The extra resistance and the order the owner asked for, **snap back first and only then open the Docs**, are kept. `.ulpi/design/pull-tab.md` is the current behaviour (maximum lift 130 px, a pull of 110 px opens the Docs).

**The tab.**
- Hover: the open hand (`grab`). While dragging: the closed fist (`grabbing`). Everywhere else the cursor is as today.
- **Drag up** from the tab. It follows the pointer with resistance, so it feels elastic: roughly the first 24 px follow 1:1, then the pull slows, with a maximum of about 140 px.
- **Let go before the threshold** (about 80 px): it springs back with one small overshoot (about 350 ms, ease-out). Nothing else happens.
- **Let go past the threshold:** it snaps up a few pixels, then the browser goes to `/docs/start`, the same page the link goes to.
- **A plain click** (a movement under about 6 px) opens the Docs exactly as it does now. The tab stays a normal link.
- **Keyboard:** Enter on the focused tab opens the Docs. No change. No keyboard drag is added, because the tab already does the one thing the gesture does.
- **Touch:** the same drag with the finger. `touch-action: none` applies only to the tab, so page scrolling is untouched elsewhere.
- **Reduced motion:** the tab doesn't stretch or overshoot. A drag past the threshold still opens the Docs, and a short drag does nothing.
- Hit area stays at least 44 px tall.

**The cursors.** Two new pairs in the existing set, `grab` and `grabbing`, from Kenney's open-hand and fist tiles, recoloured in the same two-colour way (blue in dark, yellow in light), 32 px and 64 px, hotspot at the middle of the palm. `make-cursors.js` gets two more entries and regenerates every PNG. The fallback is the system `grab` and `grabbing`.

**Build.**
- `PullTab.tsx`, a client leaf replacing `DocsTab`'s markup. It keeps `<Link>`. Pointer events with pointer capture, a ref and a CSS variable for the pull distance, and one `requestAnimationFrame` loop. No React state per frame.
- Styles next to the existing `.docs-tab` rules.
- Motion: only `transform`. Easing from the animation guidance: a strong ease-out for the release.

**Tests.**
- A pull below the threshold snaps back to zero.
- A pull past the threshold goes to `/docs/start`.
- A plain click and the Enter key still open the Docs.
- The cursor shows `grab` and `grabbing` as expected in both themes.
- Touch emulation: the drag works and the page still scrolls elsewhere.
- Reduced motion: no stretch, and a long pull still opens the Docs.
- Accessibility scan stays clean, and the target stays at least 44 px.

**Acceptance.** The tab pulls, springs back and opens the Docs on a long pull. A click and the keyboard work as before. Nothing about page scrolling changes. The full browser suite passes.

## 4. Phase 2 (optional): the pull cord and the secret level

**Dropped.** A ring on the floor and then a hidden door handle (visible only on hover) opened a hidden -1404 M level. The owner removed it on 2026-10-15. The text below is the original idea.

- A short **cord with a ring** hangs below the footer's last line. It is drawn in the sprite style (a small pixel ring), so it reads as a real object.
- **Pull it up:** the cord stretches with the same resistance. At the threshold a dark panel below the footer opens: **−1404 M, Sohle**, in the 404 page's near black, with one line (for example "You reached rock bottom. The only way back is up.") and a **Back to the surface** button that scrolls to the top. A second link to the 404 is optional.
- **Let go early:** it snaps back.
- **Keyboard and screen readers:** the ring is a real button, "Dig deeper, −1404 M", that opens the same panel. The panel is a normal, labelled region.
- **Memory:** nothing is stored, so there is no state to track. (If the owner wants a "found it" mark later, that is a separate decision, with a note on privacy.)
- **Reduced motion:** the panel opens without the stretch.
- No scroll hijacking: the gesture starts on the ring, and `touch-action: none` applies to the ring only.

**Open for the owner:** what the secret says, whether it should link to the 404 page, and whether there should be a second secret elsewhere.

## 5. Risks and how they are handled

| Risk | Handling |
|---|---|
| Fights native scrolling | The gesture starts only on the handle, never on the page. No wheel or scroll listeners are added. |
| Users can't tell it's pullable | The open-hand cursor on hover, plus a small first-visit nudge on the tab (one short wiggle, off with reduced motion). |
| Hard to use for some people | Every handle is already a link or button that works with one click or the keyboard. The pull is a bonus, never the only way. |
| Accidental drags while clicking | A 6 px dead zone before a click becomes a drag. |
| Jank | One transform, one `requestAnimationFrame`, no state per frame, no layout. |
| Pointer cursor art clashes | The same Kenney set and the same recolouring as the arrow and hand. |
| Distracts from the real fixes | It comes after the economy decisions and real details (Plan 19), and phase 2 is optional. |

## 6. Order and size

1. **Phase 1:** the grab cursors and the pull tab. A design brief in `.ulpi/design/`, one pull request, about the size of the cursor change.
2. **Phase 2 (optional):** the cord and the secret level, if phase 1 feels right. One more pull request.

Each phase needs all seven UI skills, a design brief and the usual checks, as in `docs/development/ui-skills.md`.

## 7. Decisions for the owner

1. Build phase 1 now, or after the economy work?
2. Pull **up** (recommended: it matches "the only way back is up") or pull sideways?
3. A long pull **opens the Docs** (recommended), or only springs back as a toy?
4. Do you want phase 2, the cord, and what should the secret say?
