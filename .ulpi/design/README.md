# LOADOUT design briefs index

[`DESIGN.md`](DESIGN.md) is the tool-compatible entrypoint and links to the canonical [design system](../../docs/design/system/design-system.md), which is the only current source for tokens, type, colour, grain, rulers, icons and motion. The briefs below are records of what was decided and built. A brief does not authorize a change, and where a brief disagrees with the design system, the design system wins. Product rules stay in the numbered plans; briefs describe presentation and implementation scope. An old brief does not authorize a repeat change. Briefs written before 2026-10-13 call the global currency Bolts; it is called Ore now (see [`ore-currency.md`](ore-currency.md)). Briefs are records and are not rewritten.

## Open or unresolved

| Brief | Status and owner |
|---|---|
| [`homepage-copy-depth-navigation.md`](homepage-copy-depth-navigation.md) | Owner-approved local copy reduction and interactive depth ruler. |
| [`ascii-float-preview.md`](ascii-float-preview.md) | Owner-approved local ASCII floating motion with independent timing and mixed directions. |
| [`homepage-visual-clarity.md`](homepage-visual-clarity.md) | Open proposal, linked to Plan 17. It does not authorize homepage changes until the owner approves that scope. |
| [`research-mode-builder-benefit.md`](research-mode-builder-benefit.md) | Product proposal only. Plans 01/02 must settle any bonus before it is implemented or published. |

## Implemented locally

| Brief | Scope |
|---|---|
| [`faq-question-readability.md`](faq-question-readability.md) | Slightly looser FAQ question lettering on desktop and mobile; accordion behavior and layout stay the same. |
| [`loadout-hero-atmosphere.md`](loadout-hero-atmosphere.md) | Local warm-paper palette, grain/grid, and decorative ASCII hero scenery; verified with the foundation pass. |
| [`section-corner-brackets.md`](section-corner-brackets.md) | Four corner marks on the section headings, matching the hero frame. |
| [`logo-helmet-mark.md`](logo-helmet-mark.md) | The miner's helmet logo, favicon, share image and the lamp blink. |
| [`ore-currency.md`](ore-currency.md) | The global currency is called Ore, with the ore gem icon, replacing Bolts. |
| [`depth-darkness.md`](depth-darkness.md) | The homepage gets darker the deeper you scroll, down to the 404's near black. |
| [`prize-belt.md`](prize-belt.md) | The planned prizes ride a slow, pausable belt, as in Pixl and the YSWS template. |
| [`prize-photos.md`](prize-photos.md) | The proposed prizes show one example product photo each, from Pixl, on the existing belt. |
| [`custom-cursor.md`](custom-cursor.md) | The homepage cursor is a pixel arrow with a pointing hand for links, from Kenney's CC0 pack, in LOADOUT's ink, blue and yellow. |
| [`rock-bottom-404.md`](rock-bottom-404.md) | The 404 page ("rock bottom") and the cave-in error page. |
| [`pixel-font-open-c.md`](pixel-font-open-c.md) | An open C and c in the pixel font, so a C no longer reads as an O. |
| [`docs-phone-guides-drawer.md`](docs-phone-guides-drawer.md) | Docs on phones: the Guides drawer. The icons await licence confirmation. |
| [`redesign-foundation.md`](redesign-foundation.md) | Current homepage colors, three font roles, grid/grain, thin borders, and light track panels. EN/DE and reference interactions are later passes. |

## Completed implementation records

| Brief | Current owner |
|---|---|
| [`community-era-overview.md`](community-era-overview.md) | Plan 11 for policy; Plan 06 for homepage copy. |
| [`docs-refresh.md`](docs-refresh.md) | `docs/development/architecture.md` and `content-authoring.md`; production promotion recorded in PR #28. |
| [`homepage-copy-clarity.md`](homepage-copy-clarity.md), [`homepage-information-architecture.md`](homepage-information-architecture.md) | Plan 06. |
| [`homepage-mechanics-clarity.md`](homepage-mechanics-clarity.md), [`loadout-homepage-clarity-flow-and-eras.md`](loadout-homepage-clarity-flow-and-eras.md), [`progress-and-prizes.md`](progress-and-prizes.md) | Plans 02/06/11/15 own the relevant product facts; Plan 06 owns page composition. |
| [`loadout-homepage-refinement-proposal.md`](loadout-homepage-refinement-proposal.md), [`loadout-public-landing.md`](loadout-public-landing.md) | Plan 06 and the landing implementation record. |
| [`loadout-irl-compact-card.md`](loadout-irl-compact-card.md) | Plans 06 and 15. |
| [`mobile-responsiveness.md`](mobile-responsiveness.md) | Plan 06 and current responsive implementation; PR #29 records the mobile repair. |
| [`pixel-icon-sprite-integration.md`](pixel-icon-sprite-integration.md), [`transparent-sprite-backgrounds-and-remove-bottom-cta.md`](transparent-sprite-backgrounds-and-remove-bottom-cta.md) | [`docs/design/asset-catalog.md`](../../docs/design/asset-catalog.md). |
| [`whos-behind-loadout.md`](whos-behind-loadout.md) | Plan 06 and current homepage. |

## Superseded records

| Brief | Replaced by |
|---|---|
| [`loadout-docs-and-era-redesign.md`](loadout-docs-and-era-redesign.md) | The approved Docs refresh and Plan 11's current Era policy. |
| [`pixel-sprite-svg-integration.md`](pixel-sprite-svg-integration.md), [`pre-sprite-icon-restoration.md`](pre-sprite-icon-restoration.md) | The final PNG icon set and asset catalog. Keep the owner-supplied Bolt SVG as a separate source asset. |

Completed and superseded briefs are retained as historical decisions. Use current owners and implementation code for present behavior.
