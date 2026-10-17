---
title: "Build & ship"
description: "A short checklist for a ship, then real examples to compare yours against."
group: "BUILD & REVIEW"
order: 60
status: draft
---

A ship is a version of your project that you hand in for review. Someone who has never seen your project should be able to tell what changed and check the result themselves.

## The shipping checklist {#checklist}

1. **It runs.** It starts without crashing, and the repository has a README that says how to run it.
2. **Someone can see it.** A demo or proof anyone can open: a hosted link, a video, or clear photos for hardware.
3. **The hours match.** Your tracked time is for this project and this version.
4. **Your journal is up to date.** A few sentences for each work session: what you did and why.
5. **You reflect.** Say what you built yourself, where AI helped, and what is still rough.

Then send it in with the [submission steps](/docs/submitting). Not sure where to start? The [first project guide](/docs/first-project) walks through it.

## Examples {#examples}

Two examples and one journal entry show what a good ship looks like. Read the real one first.

### A real project: Poorup {#poorup}

This one is real. [Poorup](https://poorup.tech) is a browser-based, real-time multiplayer property-trading game that Jerry built. Its server decides every move instead of trusting the player's browser. It also recovers a player who drops and reconnects, and it has automated tests that run on every change. The code is public: [see its code](https://github.com/jeremy341/Poorup).

| Part | Detail |
| --- | --- |
| Time | About 100 hours |
| Rating | 18.8 out of 20 (Jerry's own, as an illustration: no LOADOUT review has happened yet) |
| Ore | 100 hours × 18.8 = 1,880 Ore |
| What that buys | For example the enclosed 3D printer (1,000 Ore) and a Bambu Lab A1 Mini (500 Ore) |

A project rated this high is rare, and the prices are still planned, not final. The point is the shape of the reward: it comes from real hours and from what other builders think of the result.

### An invented example: a sensor board {#example}

This is an invented sample, here to show the shape of a good ship. Read the real project above first. It is not an approved project and the numbers are made up.

**Tunnel monitor: a USB temperature and humidity logger.** *Tracks: Hardware, plus a little Systems for the log format.*

> **What this version adds.** A custom two-layer board around a small microcontroller and a temperature and humidity sensor, plus firmware that logs a reading every second to onboard flash and dumps the log over USB.

*Why this opens well: it says what exists and what it does, in two sentences.*

**How it works.** The firmware reads the sensor over I2C, stores each reading in a ring buffer in flash, and answers a "dump" command over USB serial. The hard parts were wear-leveling the flash and getting readings on time while USB was busy.

*Why this helps a reviewer: it names the technical problems, so they know where to look for depth.*

**Evidence.**

- Source and design files: `firmware/`, `board/` (schematic, layout, Gerbers), `README.md` with build and flash steps.
- Parts list: 14 lines, each with a quantity and a supplier. The board and firmware are mine. The sensor module is bought.
- Demo: a 40-second video showing the board warming in a hand and the log appearing on screen.
- Tests: a bench comparison against a reference thermometer over one hour, with the error graphed. A note that humidity was only checked at room level.

*Why this works: each claim has something to open, and the gap in testing is stated, not hidden.*

**My contribution and sources.** I designed the board and wrote the firmware. I used the vendor's sensor driver unchanged and wrote my own flash layout. An AI assistant helped me draft the serial command parser; I rewrote the error handling after reading it and tested it with bad input.

*Why this helps: a reviewer can see what is yours and what the tool did, so nothing needs guessing.*

**Known limits.** No enclosure yet. Flash wear-leveling is tested for a day, not months.

### A sample journal entry {#sample-journal}

This invented entry shows the kind of detail that helps. See [Tracking & evidence](/docs/tracking) for how journals connect to recorded work.

> **Day 6: the logs have gaps.**
> Readings were missing whenever I dumped the log over USB. The USB handler was blocking the sensor read for up to 40 ms. I tried a faster I2C clock first. It made the gaps shorter, but they didn't go away. Then I moved the sensor read to a timer interrupt and let the USB code only copy bytes. Gaps gone over a 10-minute test with 20 dumps. Commit `a3f9c1`, plot in `notes/day6-gaps.png`. Next: flash wear.

It says what went wrong, what failed, what fixed it and how it was checked. It points to evidence. Compare it with "worked on firmware", which tells a reviewer nothing.

## Shipping again {#versions}

You can ship the same project as many times as you like. Each ship covers only the hours since the previous one, and it's rated on its own. Hours that were already paid are never paid again, and nothing earlier changes.

A new ship needs journal entries for its new hours and a short note saying what changed. A ship with nothing new to show isn't reviewed. If a ship is rejected, fix it and send it again: the hours stay in the same window and aren't lost.

For example, a first ship of 20 hours rated 9 pays 180 Ore. Three weeks later, a second ship of 12 new hours rated 13 pays 156 Ore. The second one doesn't touch the first.

The same implementation or hours can't be rewarded twice. [Project review](/docs/review) covers how a ship is rated.
