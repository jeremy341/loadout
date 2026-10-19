# Plan 23: Less vibed, pass two

**Status:** Built 2026-10-16 on `feature/all-changes` and pushed to `origin/feature/all-changes` at `b17aa91` (last checked 2026-10-18). Promotion and deployment remain separate. The changes are recorded in section 7. The design brief is [`.ulpi/design/less-vibed-pass-two.md`](../.ulpi/design/less-vibed-pass-two.md). Nothing here changes a price, threshold or formula; those stay with Plan 02. It follows [Plan 21](21-credibility-follow-through.md) and compares the homepage with Pixl (`references/pixl/apps/pixl-dashboard/app/_landing`) and Stardance (`references/stardance/app/views/landing`).

**Policy follow-up:** Internal age policy is 13–18; the current public site's 13–19 copy still needs correction in a later public-copy pass. Any prize prices cited here are working examples, not final promises of price, stock or fulfillment. Reviewer operations have since been decided and are recorded in Plans 02 and 22; the XP award equation remains open.

**Later owner decisions (2026-10-19):** This dated homepage/content pass predates the final review and feature-plan decisions. Any example that uses a 0–20 quality score, 5× minimum, or 5×–20× rate is a historical illustration only. Current review and economy rules are in Plans 02 and 22; the public page must not show an unapproved numeric example as current.
**Owner:** Plan 06 for the homepage structure. Commit, promotion and deployment stay separate actions.

## 1. What the comparison showed

| | Pixl | Stardance | LOADOUT today |
|---|---|---|---|
| Invented words | Many (Restoration Energy, Trials, Tiers, Core) | Few | Many, explained in several places |
| How a term is taught | Once, in one flow, then a worked example | Once, in one paragraph | Spread over How it works, Rewards, Progress, Docs and the FAQ |
| Example work | Concrete trials with a size and a prize | Prize photos | Track blurbs read like dictionary entries; Stronger/Weaker cards |
| Order | How it works, then prizes, then fine print | What is this, how it works, prizes | Four sections of rules between how it works and the prizes |
| Voice | Casual, a bit cheeky | Plain, friendly | Even and neutral, like a brochure |
| Repetition | None to speak of | None | "Not open yet" five times, the FAQ twice, repeated guide links |

## 2. Decisions

| Topic | Decision (owner, 2026-10-15) |
|---|---|
| German mining words and the depth gauge | Keep, unchanged. |
| Custom Orders | Stays on the homepage. It is an important part of the program. |
| Eras, Project fit, Research Mode | Nothing moves to Docs in this pass. They are shortened and moved lower, not removed. Revisit after the rest is built. |
| Statistics section like Stardance's | No. We have no real numbers and will not make any up. |
| Worked example | One example, not several sizes. |
| Voice | More natural and relaxed, still plain and accurate. |
| Track examples | Approved as drafted: a command-line tool, a small database or chat server, a model running on a GPU, a custom board or robot. |
| Example project | Poorup: about 100 hours, rated 18.8, pays 1,880 Ore (section 3.1). |
| Start date | None exists. The site keeps saying "not open yet" and shows no date. |
| Contact channel | The footer now has "Join #loadout" and "#loadout-help" (Slack), added by the owner and merged into this branch on 2026-10-16. A further channel later. |
| Hero ship card (a Poorup card as the hero visual) | No. |
| Varied section layouts | Yes (item 12). |
| Tags on the track examples | Yes (item 13). |
| Heading scramble effect | Keep it as it is. It is not removed. |
| "Joining late is fine" line | Yes (item 14). |

## 3. The changes

1. **One worked example in How it works.** One concrete case, not a table. It uses only agreed numbers: 20 hours at a rating of 10 pays 200 Ore, enough for a Raspberry Pi 5; the same hours at 15 pay 300. It sits under the steps, shown as a small visual (hours, rating, Ore, the prize), no money value for Ore.
2. **Teach each term once.** Ore, Track XP, levels and Requisitions are defined only in How it works. The Levels and Rewards sections show the numbers and link to Docs; they stop re-explaining.
3. **Real examples for the tracks (approved).** Each track gets one concrete example in place of the dictionary line: Tools, a command-line tool that removes a repeated step; Systems, a small database or a chat server; Compute, a program that runs a model on a GPU; Hardware, a custom board or a robot. No hour figures unless the owner supplies them.
4. **An example submission in Docs, using Poorup** (details in section 3.1).
5. **A more natural voice.** The hero support line, section intros and the FAQ answers are rewritten to sound like a person, using short sentences and "you", without slang or jokes that need explaining. The owner reads each rewritten block before it ships.
6. **One plain "what is this" paragraph** under the hero, so the whole program can be understood in four sentences. Written only from settled facts.
7. **The new order**, with prizes right after how it works (section 4).
8. **Say each thing once.** "Not open yet" lives in the hero. The prizes intro describes the numbers, not the status. The FAQ appears once, as an accordion that works without scripts. The three guide link buttons become one. "Revier edition" and "Status In development" leave the footer.
9. **Shorter hedges.** "Planned rule; final launch configuration is still being finalized" goes. Eras and IRL each keep one short line saying what is not confirmed.

10. **Fix the mobile headline.** At 375 px the second line, "technical stack.", is about 272 px wide in a box of about 234 px, so it runs past its container (measured on 2026-10-16: the text ends at 343 px, the box at 305 px). The cause is the narrow-screen size rule in `app/home.css` (`(100vw - 64px) / 8.35`), which assumes narrower letters than the pixel face has. Fix: divide by about 9.7 (so the font is about 32 px at 375 px), or let the headline wrap onto three lines below 420 px. Either keeps the whole headline readable. Check at 320, 360, 375, 390 and 430 px, in both themes, and add an e2e test that fails when a headline line is wider than its container.
11. **Repeated caveats on Eras and IRL.** Eras says "+10% PLANNED", then "10% extra Ore" in the intro, then "Planned rule; final launch configuration is still being finalized" at the bottom. IRL says "It is not an announced event" at the top and "Dates, venue, funding, and registration are not confirmed yet" at the bottom. Rule: each mechanic and each caveat appears once. General availability is stated near the top (the hero). Eras states the 10% bonus once and drops both "planned" lines. IRL keeps one event-specific note, "Dates, venue and funding are not confirmed," and drops "It is not an announced event." The wording matches the more confident Docs pages.

12. **Vary the section layouts.** Most sections are a row of equal dark cards with corner brackets, which is the strongest remaining "template" signal. Each section gets the layout that fits its content, and the bracket frame is kept on headings only:
    - Tracks: four cards stay, because they are four equal things.
    - How it works: a vertical timeline with the worked example as its last stop.
    - Prizes: the belt stays.
    - Levels and Rewards: one wide table (level, Requisition, discount) instead of five boxes.
    - Project fit: the four scoring criteria as a compact list.
    - Custom Orders: three steps in a line with arrows.
    - Eras and IRL: text beside one visual, not a card row.
    Layout changes keep the current type, colours and German labels. Each change needs a design brief in `.ulpi/design/` and a check at 375, 768 and 1440 px.
13. **Tag the track examples** with what kind of thing each is, as small chips: Tools, CLI; Systems, database; Compute, GPU; Hardware, board. The words are plain English, reusing the track icons.
14. **A "joining late is fine" line.** Ore and Track XP carry across seasons and there is no hour limit per season, week or project (both agreed in Plan 02), so the line is true as worded: "Joining late is fine. Ore and Track XP carry across seasons, so you can start whenever you join." It goes in How it works and the FAQ (as one answer), not twice on the page.

Not in this plan: a hero ship card, a statistics section, a playable demo, a countdown, a story or lore, and meme or emoji voice. Pixl has those because it has a game; we do not.

### 3.1 The example submission and the why paragraph

**Poorup as the example.** The page shows what a ship looks like with a real project, using the owner's real numbers: Poorup took about 100 hours and was given a rating of 18.8 on the 0 to 20 scale. That pays 100 × 18.8 = **1,880 Ore**, which covers for instance the enclosed 3D printer (1,000 Ore) and a Bambu Lab A1 Mini (500 Ore) from the prize list. Facts stated as true, taken from the project's own pages: Poorup is a browser-based real-time multiplayer property-trading game (poorup.tech, "Poorup · After-Hours Game Parlor"), with an authoritative Node.js and Socket.IO server, recovery when a player reconnects, automated tests and CI. Links: the game at https://poorup.tech (the main link, used wherever Poorup is mentioned) and the public repository at https://github.com/jeremy341/Poorup (a secondary "see its code" link). One honest label on the page: no peer review has happened yet, so the rating is the owner's own, shown to illustrate what a top-end ship pays. The demo link is poorup.tech.

**The why paragraph.** The owner's words, tidied, for the Hack Club block. It is signed Jerry and written as "I". It makes no claim about other programs' rates: the owner confirmed LOADOUT pays about the same as they do (roughly $5 an hour in prizes, internal only) and that the difference is the discounts.

> I love Hack Club. Through it I got a lot, and I got to know a great community. But I noticed there is no YSWS that is both general and nudges people to focus on one area, and many pay out at rates I don't think are sustainable. LOADOUT pays a fair rate and adds discounts, so you aren't just grinding for any reward: your rewards help you build faster.

Notes before it ships:
- "Better rates than other YSWS" is **not used**. The rate is about the same; the discounts are the difference. No comparison task is needed.
- The dollar figure is never published; the site shows no money value for Ore (Plan 02).
- "Rates I don't think are sustainable" is the owner's opinion about other programs. If the owner would rather not say it, the sentence is dropped and the rest stands.
- The paragraph is all "I", signed Jerry.

## 4. The new order

| # | Section | Change |
|---|---|---|
| 1 | Hero | Only place that says "not open yet". Followed by the plain "what is this" paragraph. |
| 2 | Tracks | Concrete example per track. The Research Mode box stays but is shorter. |
| 3 | How it works | Six steps and the one worked example. The one place the economy is taught. |
| 4 | Prizes | Moved up, right after earning. Prices and photos unchanged. |
| 5 | Levels and Rewards | Numbers only; links to Docs for the rules. |
| 6 | Project fit | Stronger/Weaker cards replaced by the four scoring criteria. |
| 7 | Custom Orders | Stays, and keeps its three steps. |
| 8 | Community Eras | One short block, no "still being finalized" line. |
| 9 | LOADOUT IRL | One short "not confirmed" line. |
| 10 | FAQ | One accordion. |
| 11 | Hack Club and the team | The owner's "why" paragraph goes here once it exists. |

Depth labels (the German words) are reassigned in this order so the numbers still count down without gaps; `DepthNumeral`, `DepthGlow` and the nav anchors follow.

## 5. Order of work

1. Repetition and hedges (items 8, 9, 11), and the mobile headline (10). Small, nothing needed from the owner. The headline fix goes first because it is a visible bug.
2. Track examples (3), approved.
3. The worked example and the one place for the economy (1, 2).
4. The new order and the plain "what is this" paragraph (6, 7).
5. The voice pass (5), block by block, with the owner reading each. The tags (13) and the joining-late line (14) go in with the track and How it works edits in steps 2 and 3.
6. The layout variety (12), one section per commit, after the order is settled.
7. The example submission with Poorup (4) and the why paragraph (3.1), once the owner confirms the why paragraph.

Each step is its own commit with the e2e suite green before the next.

## 6. Still needed from the owner

- A confirmation of the why paragraph as worded in 3.1, and whether to keep the "rates I don't think are sustainable" sentence.
- A further contact channel beyond the two Slack links, later.

## 7. What was built, and where it differs from the plan

Built: items 1 to 14 except those below, in the order of section 5, one commit each. Checks at the end: typecheck, lint, 47 unit tests and 167 e2e tests all passing.

- **How it works keeps its flow chart.** It already is a vertical chart with arrows, designed on purpose, so the planned timeline was not built. The worked example became a small visual (hours, rating, Ore, prize) under the chart, and the joining-late line sits next to it. The FAQ does not repeat it.
- **Layouts changed:** Levels and Rewards (rail plus rows), Project fit (four criteria as rows), Custom Orders (three steps in a line), Eras (the rail stays, the two facts became rows), IRL (three days on a line). Tracks, the prize belt and the FAQ keep their layouts.
- **The FAQ** is native details elements: it works without scripts, there is no second copy, and each answer opens on its own.
- **The headline** at narrow widths now divides by 8.6 (not 9.7) after measuring; the desktop cap is 120 px so the second line fits at 1440 and 1920. A test checks 12 widths.
- **Poorup** is a real example in Docs, Build and ship (section "A real project: Poorup"), not a separate page, linking poorup.tech first and the code second. The rating is labelled as the owner's own.
- **Jerry's reason** is in the Hack Club block as a pull quote, signed "Jerry, lead organizer". The wording is the tidied version in section 3.1 and still needs the owner's yes.
- **Not done, by decision:** the hero ship card, a statistics section, removing the heading scramble.
