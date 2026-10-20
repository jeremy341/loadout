---
title: "Tracking & evidence"
description: "Track the time, write down what happened, and keep the files that show it."
group: "BUILD & REVIEW"
order: 70
status: draft
---

The timer says you've worked for three hours. What happened in them? That's what your journal helps us understand. Tell us what you tried and changed, then link the files, photos or measurements that show the result. Together, those records let a reviewer follow the work behind the time you're claiming.

Keep those records as you build. If you leave them until shipping day, you'll have to remember which experiment failed on Tuesday and why the board in Wednesday's photo has an extra wire.

## Tracked, journaled and approved work

| Record | What it tells us |
| --- | --- |
| Tracked work | How much time you recorded for this project. |
| Journal | What you tried, changed and decided during that time. |
| Approved work | The eligible contribution the evidence supports. |

These figures can differ. If a session is unclear, we may ask about it or approve only the part we can verify. Hackatime is required for software projects; Lapse is required for Hardware projects. Their LOADOUT connections are not live yet; [Time tracking setup](/docs/time-setup) explains the planned setup.

Each builder must add a journal entry for every eight hours of development on each project. Hardware ships also require a bill of materials. Project pages and journals are public by default; Lapse recordings are visible only to reviewers.

## What a useful journal says

Start with what's changed since your last entry, then tell us how you got there. Maybe you tried two approaches before one worked. Why did you drop the first? Or perhaps neither worked yet. In that case, explain what you've ruled out and what you want to try next. That still gives the reader something useful to follow.

“Worked on memory usage” leaves the whole story out. Explaining that you compared two buffer layouts, found one used less memory and checked that it produced the same output gives the reader a decision to follow. Include the measurements so they can check your conclusion too.

If you'd like to see what that looks like, read the [sensor-board journal](/docs/shipping#sample-journal). It follows a longer session, so there's quite a bit to explain. You don't have to match its length or copy its structure every day. A small change might need a short entry; an investigation with several failed attempts will usually take more space.

### Useful evidence

Take screenshots, photos or short clips while you work, when there's something worth showing. A half-assembled device and a note about the connector that didn't fit can explain more than a photo of the finished enclosure.

Match the evidence to the claim. For a benchmark, include inputs and conditions; for a mechanism, show it moving under the load you tested. Link commits and measurements near the part of the entry they support, and check logs and images for passwords, tokens or private information before sharing them.

## No double counting

Count each stretch of work once. If a session covered two tasks, split its time between them instead of assigning the full session to both.

Team members record their own contributions. When you ship an update, include the new hours since the earlier ship; work already approved and paid doesn't earn again.

## What if I'm missing a record? {#when-evidence-has-gaps}

Tell us what happened and send what you still have. Losing a recording is a different problem from being unsure who wrote a piece of code, so we need that context to work out what we can check. If we send the ship back, the [review feedback](/docs/review#feedback) should explain what we'd need from you next.
