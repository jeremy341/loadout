# Field Use (name: Toolbelt) — proposal

> Full write-up, using "project" for everything you equip: see [toolbelt.md](toolbelt.md). This file is the earlier working draft.

> Status: **proposal, not approved.** Ore values and caps are placeholders until the owner approves them under [Plan 02](../02-economy-and-rewards.md). Nothing here changes the public site.

## 1. Why LOADOUT exists

**The primary line:** *Build your own technical stack.*

**The core thesis:** *Build things that make builders more capable.*

LOADOUT is a technical YSWS for high-school students aged 13–18. A builder ships a real technical thing (a developer tool, a service, a board, a benchmark), earns Ore and Track XP for it, and spends the Ore on gear for the next, harder build. The public site puts it as: *Build something technical, ship it, and earn Ore for it. Spend the Ore on gear for your next build.*

The loop it is designed around, from [Plan 01](../01-product-and-program.md):

> Build capability → earn capability → build harder capability.

Two halves make up a LOADOUT:

- **Digital Loadout:** the things you built. Every accepted ship goes on your profile.
- **Physical Loadout:** the things you earned. What you buy with Ore, such as an FPGA board, a better SSD or a 3D printer.

The public homepage and plans describe the program as a builder progression system and a portfolio of technical capability, not a general "build anything" program and not a grant form. The [LOADOUT test](../01-product-and-program.md) asks whether the core project meaningfully expands technical capability for the builder or for other builders.

## 2. Focus: getting better in one area

The track system is already how LOADOUT encourages focus:

- Four lifetime tracks: **Tools, Systems, Compute, Hardware**.
- Track XP goes into the tracks a ship actually uses and stays with the builder.
- Track levels (LV.15 is about 178 approved hours, LV.20 about 275) give a permanent discount on related gear, up to **20%** at LV.20.
- Field Requisitions at LV.5, 8, 11, 15, 18 and 20 each add 10% off one eligible prize. Combined savings cap at **40%** with a General Requisition (updated 14 Nov 2026; it was 25%, then 30%).
- Most cross-track gear stays buyable. Specialist and mastery gear is level-gated.

So a builder who goes deep in one track gets cheaper gear in that track, but nobody is locked out of the others. Focus is rewarded, not required.

## 3. Public online LOADOUT

Accepted projects are public by default: source under an open-source licence, the project page, and the journal. The Digital Loadout is the builder's public profile of what they have actually created. [Plan 01](../01-product-and-program.md) also describes a bounded community where builders find friends, follow people and respond to each other's work.

The public side is what makes the Armory credible: a tool can only be reused by others if its source and journal are public.

## 4. The Armory: reusing shipped tools

**The idea.** A shipped LOADOUT project can be *equipped* by another builder for their own project. The equipped tool is used, not just mentioned. Both builders benefit, and the work gets reused in public.

**Rules agreed so far:**

1. **Only shipped LOADOUT work** can be equipped: an accepted project that the team has approved.
2. **One tool per project.** A project can equip at most one builder tool. This blocks stacking.
3. **A per-builder equip cap.** A builder can have a small number of tools equipped at once. Suggested starting value: **2**.
4. **Cross-track counts.** A tool from one track can be used in any track. Same-track use gives depth credit toward that track.
5. **Use, not endorsement.** An equip is a claim that the tool is used for a real problem in the builder's project. The equip must say what problem it solves.
6. **Ongoing use, not a one-time claim.** Use runs over time. The builder adds short devlog **checkpoints** saying how the tool is still being used. The reviewer confirms one or two checkpoints, not every entry.
7. **Credit is paid per confirmed checkpoint.** It stops when the builder unequips. The maker's credit follows the same checkpoints.
8. **Caps on payouts.** Suggested cap: at most **6** paid checkpoints per tool per user, so one long claim can't be farmed.
9. **No self-use.** A builder can't equip their own tool.
10. **One pair, one count.** A given builder/tool pair pays out at most once per period.
11. **Optional.** Nobody has to equip anything, and a project with no equipped tool is still complete.

**Bonuses (placeholders):**
- **User bonus:** an Ore bonus for the builder who equips a tool and keeps it in use.
- **Maker bonus:** an Ore bonus for the builder whose tool is used, plus a visible credit line on their Digital Loadout ("used by …").
- Exact values, stacking with the Era bonus, and daily claim limits are for [Plan 02](../02-economy-and-rewards.md) to set.

**Why it reinforces focus.** Equip slots are limited, and a tool's credit is tied to its track. Equipping a Compute tool in a Systems project counts across tracks. Building a deep Compute tool and having others use it rewards the maker's depth.

**Why it reinforces the public loadout.** The equip link sits on both profiles. Reuse is visible, so builders can find, follow and respond to each other's tools.

**Why it gives back.** A builder's shipped tool becomes something other people use to solve real problems. That is what the program means by strengthening skills and giving back to the community.

## 4a. Full design

### Name

"Armory" suggests weapons, and this isn't about weapons. Equipping is closer to putting a tool on a belt. **Decided (owner, 13 Nov 2026): Toolbelt** (verb: equip; the set of tools a builder carries). The rest of this document uses "Toolbelt" for the mechanic.

### What counts as using a tool

A use is a real dependency in the user's project. The project's code, config, build or hardware calls the tool: an import, a CLI call, a service connection, a board component. A use needs three things:

1. A link to the shipped LOADOUT project being used.
2. A use note: the problem it solves, and where in the project it's used (a file path or diagram).
3. A first checkpoint showing it running in the user's project.

Trivial use is rejected: one hello-world call to get the badge is not a real use. The reviewer decides.

### Lifecycle

`Requested → Verified → Active → (Paused | Ended)`

- **Requested.** The user adds a tool and a use note.
- **Verified.** A reviewer checks the link, the note and the first checkpoint. Target: a few days.
- **Active.** Checkpoints are added and confirmed while the tool stays equipped.
- **Paused.** The user unequips. Credit stops. History stays on both profiles.
- **Ended.** The maker retires the tool or the user's project ends. Credit stops. Both sides keep the record.

### Who gets what

- **Track XP: none (decided, owner, 13 Nov 2026).** Track XP comes from approved hours in the project that earned it. Paying XP for equipping would open a second route to levels with no building. Equipping can still help a project's own hours through normal review.
- **Ore:** a user bonus and a maker bonus, paid per confirmed checkpoint, each with a cap. Values are placeholders for [Plan 02](../02-economy-and-rewards.md) to set.
- **Recognition (free):**
  - "Used by N builders" on each tool.
  - "Field-tested" badge at 10 distinct active users (suggested).
  - "Widely used" badge at 50 (suggested).
  - Credit line on both Digital Loadouts ("used by …" and "uses …").

### Anti-gaming

- **Reciprocal pairs (A equips B, B equips A):** the pair pays at most once per period. Reviewers can see the pair graph.
- **Fake projects:** equipping needs an accepted project of the user's own. Using the Toolbelt requires building, not just signing up.
- **Trivial use:** rejected at verification (see above).
- **Recycled checkpoints:** each checkpoint needs new evidence since the last one, such as a dated commit, log output or photo of a board running.
- **Multiple accounts:** rely on Hack Club teen verification, which Plan 01 already requires.
- **Tools nobody really uses:** pay nothing. The maker bonus only follows confirmed use.

### Reviewer workload

Reviewers are the bottleneck, so the checks must stay small:

- **Verification:** one check per equip (the link, the use note and one file or line in the project).
- **Checkpoints:** reviewers check one or two per tool per period. The rest are confirmed automatically when the new evidence exists, with a random audit of a sample.
- **Budget:** set a reviewer-minute budget per 100 equips before launch. Plan 05 owns operations.

### Privacy and safety (ages 13–18)

- Show handles only. No real names, schools or locations.
- Equips and checkpoints are public like journals. Existing reviewer-only attachments apply to evidence.
- A maker can block a builder from equipping their tool.
- Reports go to reviewers. A reviewer can revoke an equip.
- No direct messages in v1. Comments on checkpoint devlogs follow the existing community rules.

### Maker side

- A maker can mark a tool **open** (default) or **paused for use** with a notice.
- If a tool breaks, the maker posts a notice. Users unequip without penalty.
- Each equip records the tool version at verification. Breaking changes don't make a maker liable for the user's project.

### How it strengthens the four ideas

- **Focus:** two slots force a choice, cross-track use still counts, and deep tool makers get reuse.
- **Public loadout:** the Toolbelt shows what you use, not only what you made.
- **Getting better:** a builder who equips a Compute tool learns from its maker's journal and checkpoints.
- **Giving back:** a maker's shipped work keeps paying off in other people's projects.

### Metrics to watch

- Verified equips per week.
- Share of equips that cross tracks.
- Checkpoint continuation rate (how many equips reach a second checkpoint).
- Reports per 100 equips.
- Reviewer minutes per verified equip.
- Share of accepted tools with at least one active equip.

### Phasing (confirmed)

- **v1:** Toolbelt list and verified equips. One tool per project. Cross-track counting. No Ore.
- **v2:** checkpoints and the Ore bonuses, after Plan 02 sets values.
- **Later:** badges, the "most used" list, and any Physical Loadout link.

## 5. Risks

- **Cold start.** Nothing can be equipped until enough tools are shipped. The first cohort may see little use. Mitigation: start with same-track suggestions and a visible list of approved tools.
- **Gaming.** Fake use, reciprocal equips and farmed checkpoints. Mitigation: reviewer checks, caps, no self-use, one pair one count.
- **Narrowing.** Tying the Armory to tracks could make builders feel they must pick one. Mitigation: cross-track counting, and the same-track credit is only a depth bonus, not a requirement.
- **Physical Loadout is barely helped.** Reuse adds little to hardware upgrades. This is a known gap, not a blocker.
- **Competition.** cont.d already rewards remixing, Flavortown and Stardance reward general effort, and niche programs cover one area. LOADOUT's distinct piece is a shared stack of shipped tools across four tracks. Reuse alone does not stand out.

## 6. Open decisions

1. ~~Final name~~ **Decided: Toolbelt** (owner, 13 Nov 2026).
2. Tools per project: one (agreed) or two.
3. Equip cap per builder: 2 suggested.
4. Checkpoint interval and cap: every 2–4 weeks; max 6 paid checkpoints per tool per user suggested.
5. Whether devlog checkpoints apply to every use, or only ongoing use.
6. Bonus sizes, stacking with the Era bonus, and daily claim limits (Plan 02).
7. Badge thresholds for "used by" recognition (10 and 50 suggested).
8. Whether this ships in v1 or later (suggested: after the first accepted cohort).

## 7. Phasing (suggested)

- **v1:** approved tools can be listed; one tool per project; cross-track counting; no bonuses yet. Shows the Digital Loadout credit line only.
- **v2:** equip cap, checkpoints and maker/user bonuses, after Plan 02 sets values.
- **Later:** badges, a public "most used" list, and any Physical Loadout link.

## Related

- [Plan 01 — Product and program](../01-product-and-program.md)
- [Plan 02 — Economy and rewards](../02-economy-and-rewards.md)
- [Plan 11 — Eras and community progression](../11-eras-and-community-progression.md)
- [Future platform UI](future-platform-ui.md)
