---
title: "Project review"
description: "We check the ship, other builders rate it, and that rating sets your Ore per hour."
group: "BUILD & REVIEW"
order: 80
status: draft
---

When you send in your project, someone on the team first checks that it fits LOADOUT and that we can verify the work and hours you're claiming. Once it passes that check, other builders review its quality. That's where your **Ore multiplier** comes from, so help them understand both what you've built and the work it took to get there.

## Who reviews my project? {#stages}

| Stage | Who | What they're doing |
| --- | --- | --- |
| Check | A team member | Opens your files and demo, checks authorship and verifies the eligible hours. |
| Rating | Other builders | Considers the project's quality using the four dimensions below. |
| Payout | The system | Adds Ore and Track XP from the accepted ship. We can hold a payout if something needs investigating. |

Why have a team check before the builder review? If your demo doesn't open or the board files are missing, other builders won't have enough to assess. We'll ask you to sort that out first, so they can spend their time looking at the project itself.

So if we send the ship back, read what we're asking for before rebuilding everything. It might just be a dead demo link or a missing file. Fixing that gives us what we need to carry on with the review.

## How other builders rate it {#quality}

We ask reviewers to consider four things. Each tells us something different about your build, so a project with a polished demo still needs to show the engineering behind it:

| Dimension | What the reviewer is looking for |
| --- | --- |
| Originality | The idea or approach you contributed, including how you worked around unusual constraints. |
| Technical Depth | The difficult problems you tackled and your understanding of the solution. |
| Execution | Whether the project does the job you claim, including the behavior you've tested. |
| Documentation | Whether somebody can understand, inspect or reproduce the work. |

Take the [sensor-board example](/docs/shipping#example). The circuit and firmware show what the builder implemented. The comparison with a reference thermometer backs up the temperature claim, while the stated limits stop a room-temperature test from becoming a claim about every environment. Together, those details give reviewers a much better picture than a polished product photo alone.

Each ship needs **12 countable peer reviews**. Reviewers score the four dimensions from **1 to 9** and give a written reason of at least ten words. We take the median score in each dimension, average those four medians, compare that score with the review pool, then map its percentile through the payout curve.

Normal rates run from **1× to 20×**, with a target mean of **10×**. At 10×, each approved hour earns 10 Ore. A project that reaches **Great Signal** can raise its hourly ceiling to **30×**. Good Signal grants +50 Ore and an achievement/shop reward; Great includes the Good rewards and a Great achievement. The total Signal reward, including any hourly-rate uplift, is capped at 5,000 Ore per project. Signal is for verified attention from outside LOADOUT; Usage Milestones for real project users are separate.

**10× means 10 Ore per approved hour.** Twenty approved hours at 10× earn 200 base Ore. A higher multiplier raises that ship's payout; it doesn't change how many hours you recorded. [Ore, XP & levels](/docs/progress#work) has the full comparison.

Payout locks after both conditions are met: the ship has 12 countable reviews, and at least 24 hours have passed since its latest journal entry. A 24-hour flag window follows; a pending flag holds payout for moderator review. Builders can see the scores and reasons on their own ship, but reviewer names stay hidden. Three flags rejected within ten hours deduct 5% from that builder's next final Ore payout. There's no separate appeal after the flag window.

## Cheating {#fraud}

Fake or padded hours, copied work presented as your own, invented evidence and trading ratings with friends are fraud. The consequence is a **permanent ban, with everything earned or bought taken back**. There is no second chance.

There's no cap on genuine hours or projects. If something took longer than expected, explain the problem and keep the record of the attempts. An honest failed experiment is something we can discuss; invented progress isn't.

## AI use and team projects {#authorship}

Give credit where the work appears. A teammate's firmware, a vendor driver and an AI-assisted parser have different authors, and a reviewer should be able to tell them apart. [AI & team contributions](/docs/ai-teams) shows what to disclose without turning your submission into a list of every conversation you had.

## Feedback and revisions {#feedback}

What if the feedback asks you to change something? It should explain the problem and what we'd need to see to check it again. You can then fix the issue and send the unpaid work back. Your hours stay in your records while you do that; we're asking for the correction so we can verify them.

When you ship a new version instead, describe the changes and include the new journal entries. That version gets its own review and multiplier; we don't recalculate the old payout or pay for its hours twice. See [Shipping again](/docs/shipping#versions) for the minimum new work.

## Questions about a decision

If you think we missed something, send the review reference, the part you disagree with and the evidence behind your question to [#loadout-help](https://app.slack.com/client/E09V59WQY1E/C0C6XBLM0M7). That gives us a specific decision to look at.

If you think a review breaks the published rules, flag it during the 24-hour window so a moderator can check it. There's no separate appeal after that window.
