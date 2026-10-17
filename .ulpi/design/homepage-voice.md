# Homepage voice: plainer copy on the homepage

Status: implemented on the feature/homepage-voice branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md) and [Plan 06](../../plans/06-public-homepage.md). Plan: [Plan 19](../../plans/19-credibility-prizes-economy-cursor.md), workstream C (homepage half). The participant Docs were reworded in a separate change.

## Design read

A reviewer said the site feels written by AI and has few real details. The homepage was already shorter than the Docs were, so this is a light pass: plainer verbs, fewer coined phrases, no new claims. No layout, colour, type or motion changes.

## What changed

| Where | Before | After |
|---|---|---|
| Hero lead | Build tools, systems, compute, and hardware. Earn Ore for equipment and Track XP in the fields your work uses. | Build something technical and get it reviewed. Earn Ore to spend on equipment, and Track XP that grows in the fields you work in. |
| Rewards: Ore | Pay the final price in Ore. | Spend it on prizes. You see the final price first. |
| Rewards: levels | Apply the discount earned in that track. | A higher level in a track takes money off related prizes. |
| Rewards: Requisition | Apply more of your track discount to one eligible prize. | Lets more of your discount apply to one prize. |
| Progression | Each track has its own lifetime level. Higher levels unlock better prices on that track's prizes. | Each track has its own level, and you keep it. A higher level means better prices on that track's prizes. |
| Project fit labels | Higher signal / Lower signal | Stronger fit / Weaker fit |
| Eras | A shared technical theme advanced by approved projects across the four tracks. | A technical theme the whole community works toward. Approved projects, in any of the four tracks, move it forward. |
| IRL | A proposed three-day hackathon in Germany's Ruhr area, not an announced event. | A proposed three-day build weekend in Germany's Ruhr area, Friday to Sunday. It is not an announced event. |

The same hero sentence is kept in `app/site-content.ts`. The test that pins the Eras line is updated; the IRL test keeps its wording rules ("proposed", "not an announced event", not "A planned three-day").

## Rules kept

No new price, number, date, threshold or promise. "You see the final price first" restates [Pricing](../../content/docs/pricing.md), which says the catalog must show the final price before an order. Nothing about the Era bonus or its 14-day minimum moved.

## Not done here

Real numbers and a worked example on the homepage need the owner's decisions (Plan 19, workstream F). A human "who made this" paragraph needs the owner's own words.

## Skills

All seven UI skills were loaded for this branch of work (`frontend-design-ui-ux`, `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites`, `pixel-art-animator`). This is a copy-only change, so the motion, SVG and sprite skills added no work. The copywriting and UX-copy skills guided the wording.

## Acceptance

1. The lines above read as shown and nothing else on the page changes.
2. The whole browser suite, typecheck, lint and unit tests pass.
