# Real details: the homepage and Docs say what is decided

**Historical brief:** This 2026-10-16 copy pass contains superseded 0–20 review scores and 5×–20× payout examples. Current review/economy policy is in [Plan 22](../../plans/22-peer-review-and-multipliers.md) and [Plan 02](../../plans/02-economy-and-rewards.md). Internal age policy is 13–18; public age copy is intentionally left for a later public-copy pass. Do not reuse its figures as current participant-facing rules.

Status: implemented on the feature/real-details branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md), the [design system](../../docs/design/system/design-system.md), [homepage-voice.md](homepage-voice.md) and [prize-photos.md](prize-photos.md). No layout, colour or motion change: this is copy, one new line of example text and a price on each prize card.

## Design read

Reading this as: a landing page for teenage builders, whose feedback was that it feels generated and has few real details. The fix is not more design. Stardance and Pixl (the references) say who it is for in the hero, give a rate, show a worked example with real numbers, price their prizes, and answer the first questions in short, human sentences. LOADOUT said none of that, hid behind "not decided" in every section, and used invented drawing details (a sheet number, a revision letter, "Anno 1900") that mean nothing. Counterfactual test: the same sentences could sit on any program page; "10 Ore for a solid hour, rated 0 to 20 by other builders, 24 Ore for a domain" can only be this one.

## What changes

| Place | Before | After |
|---|---|---|
| Hero tag, side note, facts | "Technical builders"; "Blatt 001, Rev A, Anno 1900"; "Technical projects, four tracks, build your loadout" | "For teens 13 to 18"; "Teens 13 to 18, not open yet, RSVP first"; "Teens 13 to 18, 10 Ore for a solid hour, not open yet" |
| Hero line | Defined terms (Ore, Track XP) with no numbers | "You build a technical project and ship it. Other builders rate it, and every hour you put in earns Ore. Spend Ore on real gear for your next build." |
| How it works | Process wording ("A journal is a build log…") | Plain steps, the 0 to 20 rating in step 4, "ship again" in step 6, and one worked example: 20 hours rated 10 is 200 Ore, a Raspberry Pi 5 |
| Levels and Requisitions | Requisition I, I, II, II, Master | Five identical Requisitions at levels 3, 6, 9, 12 and 15; level 15 is about 350 hours and 20% off |
| How rewards work | "A higher level takes money off" | "Up to 20% off, at level 15"; "another 20% off one prize of 400 Ore or more" |
| Prize cards | Photo and name | Photo, name and planned price in Ore |
| FAQ | 8 long answers, the first saying nothing is decided | 12 short ones: who can join, is it open, what counts, how time is tracked, how to earn Ore, XP, what to buy, AI, team, cheating, is it a Hack Club program, where to ask |
| People | A "Who's behind LOADOUT?" section: three names with one line each, no photos, no reason why | The references have no such section (Pixl has two credit lines under the hero button, Stardance only explains Hack Club). So: one line under the hero button, "Organized by Jerry, Fazin & Netic. Community by Kernel", each name linking to a Docs page (`/docs/team`) that says what each of us has built (Poorup, Rivet) and what Orry is. The homepage keeps a small "What is Hack Club?" block where the section was, and the deepest depth marker ("The people") goes. |
| Docs | Hedged ("aren't published yet") | The decided numbers: eligibility, the rate and rating, levels, pricing with a worked example, Requisitions, planned prices, review and shipping again |

## Not changed, on purpose

- The depth markers, the German section names and the hero side stacks: they carry the Ruhr mining story. Only the pieces that said nothing were cut.
- Eras, Custom Orders and IRL sections keep their text for now. They are still hedged and are the next thing to move into the Docs (see Plan 21).
- No dollar or euro value for Ore appears anywhere. The site shows Ore only.
- No start date, no email, no participant counts: none exist, and we say so.

## Voice rules for this copy

Short sentences. Say the number. Say what is not decided once, in the place it matters, not after every claim. "You" and "we". No "may", "planned" or "could" unless something really is undecided. No definitions where an example works.

## Accessibility

No new interactive element. The example line is plain text in a landmark section, at body size, with the existing foreground colour and a 3px accent rule. The price on a prize card is real text inside the card, read after the name. Contrast is unchanged: the same foreground on the same backgrounds, at 80% opacity for the small price, which stays above 4.5 to 1 in both themes (it is the same colour the card's category label already uses).

## Skills

All seven UI skills were loaded for this branch of work: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend` (the copy rules above and the anti-template cuts), `emilkowal-animations` (nothing is animated by this change), `svg-design` (no icon change), `pixel-art-sprites` and `pixel-art-animator` (no art change).

## Acceptance

1. The hero says teens 13 to 19 (owner update 2026-10-16, was 13 to 18), and the facts strip says 10 Ore for a solid hour and not open yet.
2. "Blatt", "Rev A" and "Anno 1900" appear nowhere on the homepage.
3. How it works shows the worked example and the 0 to 20 rating.
4. The level rail shows five identical Requisitions.
5. Every prize card shows its planned price in Ore.
6. The FAQ has 12 short answers and the first is who can join.
7. The Docs say the decided numbers and nothing the owner has not approved; the guard test passes.
8. The whole browser suite, typecheck, lint and unit tests pass.
