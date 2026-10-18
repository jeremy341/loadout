---
title: "Project types"
description: "What a ship looks like for software, hardware, web, mobile and games."
group: "BUILD & REVIEW"
order: 63
status: draft
---

Every project has the same shipping checklist, but each kind of project has its own proof. Start with the one that fits yours.

## Software {#software}

Before you ship software, check that you can answer yes to each of these.

- **Source:** Is the code in a repository someone can open, with a clear license?
- **Run it:** Can a stranger run it from a clean checkout using only your README? List the versions that matter (language, runtime, OS).
- **Show it:** Is there a short demo, a recording, a terminal session or a screenshot of real output?
- **Prove it:** Do tests, benchmarks or measurements back up the claim you are making? A nice screenshot alone does not show that a runtime, a tool or an algorithm works.
- **Limits:** Does the README say what does not work yet?
- **Your part:** Is it clear which code is yours, which came from a library and which came from a tutorial or an AI tool?

## Hardware {#hardware}

For hardware, check these.

- **Design files:** Schematic, board layout, CAD or enclosure files, in their source format and as a viewable export.
- **Firmware:** The code that runs on the device, with how to build and flash it.
- **Parts list:** Every part, with the quantity and where you got it. Mark anything you designed yourself and anything you bought ready-made.
- **Photos:** The real device, not only a render. Show it powered and doing something.
- **Demo:** A short video or log of it working, ideally with the numbers it measures or the thing it controls.
- **Tests:** What you checked and how. A bench measurement against a known reference counts. So does an honest "it failed here".
- **Limits:** Say what is simulated, what is unfinished and what you haven't tested. Do not present those as a working physical result.

## Web apps {#web}

- **Demo:** a link anyone can open, not only you on your own machine.
- **Run it:** the README lists the versions you need, and a stranger can start it from a clean copy.
- **Show what you built:** a short recording of the main use, plus a note on what you wrote and what came from a library.

## Mobile apps {#mobile}

- **Demo:** a recording of the app on a real phone, or a test build someone can install.
- **Run it:** the README says which platform and tools you used.
- **Show what you built:** the screens you designed and the parts that hold data or talk to a server.

## Games {#games}

- **Demo:** a playable build, or a video of the game running from start to finish.
- **Run it:** the README covers the engine version and any assets you did not make.
- **Show what you built:** your scripts, levels or systems, and which art and music came from elsewhere, with its licence.
