---
title: "Build & ship"
description: "What to hand in with a project version: checklists for software and hardware, a sample submission and a sample journal entry."
group: "BUILD & REVIEW"
order: 60
status: draft
---

A ship is a version of your project that you hand in for review. It is not a time total. Someone who has never seen your project should be able to tell what changed and check the result themselves.

> **Submissions are not open yet.** This page says what we expect to ask for. It is not a guide to a portal that exists today.

## From an idea to a ship {#steps}

1. Pick a technical capability and the track or tracks it belongs to.
2. Build it. Keep a journal as you go.
3. Package a result someone else can run or look at, with the files behind it.
4. Say what this version adds, what you did yourself, what is still rough, and what help you had (AI included).
5. Submit it for review once submissions open.

## Software checklist {#software}

Before you ship software, check that you can answer yes to each of these.

- **Source:** Is the code in a repository someone can open, with a clear license?
- **Run it:** Can a stranger run it from a clean checkout using only your README? List the versions that matter (language, runtime, OS).
- **Show it:** Is there a short demo, a recording, a terminal session or a screenshot of real output?
- **Prove it:** Do tests, benchmarks or measurements back up the claim you are making? A nice screenshot alone does not show that a runtime, a tool or an algorithm works.
- **Limits:** Does the README say what does not work yet?
- **Your part:** Is it clear which code is yours, which came from a library and which came from a tutorial or an AI tool?

## Hardware checklist {#hardware}

For hardware, check these.

- **Design files:** Schematic, board layout, CAD or enclosure files, in their source format and as a viewable export.
- **Firmware:** The code that runs on the device, with how to build and flash it.
- **Parts list:** Every part, with the quantity and where you got it. Mark anything you designed yourself and anything you bought ready-made.
- **Photos:** The real device, not only a render. Show it powered and doing something.
- **Demo:** A short video or log of it working, ideally with the numbers it measures or the thing it controls.
- **Tests:** What you checked and how. A bench measurement against a known reference counts. So does an honest "it failed here".
- **Limits:** Say what is simulated, what is unfinished and what you haven't tested. Do not present those as a working physical result.

## A sample submission outline {#outline}

Use something like this as a starting point. Short is fine. Specific is better.

1. **Title and one line.** What it is, in plain words.
2. **Track or tracks.** Which fields the work belongs to, and why.
3. **What this version adds.** For a first ship, the whole project. For a later one, only the new work.
4. **How it works.** A paragraph or a diagram. Name the one or two hard problems you solved.
5. **Evidence.** Links to the source or design files, the demo, the tests and the measurements.
6. **My contribution.** What you built, what you reused, what teammates did.
7. **AI and sources.** Where you used AI, what you checked yourself, and what you borrowed.
8. **Known limits.** What is rough, missing or untested.

## Example: a sensor board with firmware {#example}

This is an invented sample, here to show the shape of a good ship. It is not an approved project and the numbers are made up.

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

## A sample journal entry {#sample-journal}

This invented entry shows the kind of detail that helps. See [Tracking & evidence](/docs/tracking) for how journals connect to recorded work.

> **Day 6: the logs have gaps.**
> Readings were missing whenever I dumped the log over USB. The USB handler was blocking the sensor read for up to 40 ms. I tried a faster I2C clock first. It made the gaps shorter, but they didn't go away. Then I moved the sensor read to a timer interrupt and let the USB code only copy bytes. Gaps gone over a 10-minute test with 20 dumps. Commit `a3f9c1`, plot in `notes/day6-gaps.png`. Next: flash wear.

It says what went wrong, what failed, what fixed it and how it was checked. It points to evidence. Compare it with "worked on firmware", which tells a reviewer nothing.

## Credit and AI disclosure {#disclosure}

- Name every library, driver, tutorial, design and AI tool that shaped the project, and respect their licenses.
- Say what you did beyond them. Using a library is not the same as writing it.
- If AI helped, say where, and show what you understood and checked yourself. AI use alone does not rule a project out. [AI & team contributions](/docs/ai-teams) has the full expectations.
- On a team, each person describes their own part. The team's hours are not awarded to everyone.

## What reviewers look at {#reviewers}

Reviewers try to open your files and run or inspect your result. They ask whether the project fits LOADOUT, whether the evidence backs the claims, and then how strong the work is across Originality, Technical Depth, Execution and Documentation. [Project review](/docs/review) explains the stages.

They look for the hard part you solved and the proof that it works. A short, honest submission with solid evidence beats a long one that only describes a result.

## Tracking and journals {#journal}

Connect tracked work to decisions, experiments, failures and fixes. Recording time does not guarantee approval. [Tracking & evidence](/docs/tracking) explains how the pieces fit.

## Shipping another version {#versions}

A later ship should contain genuinely new work. Explain how it differs from the version already accepted, and submit only the new part.

The same implementation or hours cannot be rewarded twice. [Project review](/docs/review) covers the review stages.
