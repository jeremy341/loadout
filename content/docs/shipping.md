---
title: "Build & ship"
description: "Get a version ready for review, with a checklist and examples you can use."
group: "BUILD & REVIEW"
order: 60
status: draft
---

Once you've got a version working, take a moment to look at it as someone who hasn't been building alongside you. They won't know which command starts it or why the demo asks for a password. A little time spent explaining those things will make it much easier for them to try your project and review the work.

## The shipping checklist {#checklist}

1. **Try a fresh copy.** Follow your own README. For software, check the dependencies and run commands from a clean checkout. For hardware, check that the design files match the device you're showing.
2. **Show it working.** Include a demo, recording, release or photos that demonstrate the actual behavior. A picture of the interface alone won't show whether the underlying system works.
3. **Match the hours to this version.** Check the project name, journal entries and time records. Leave out hours already paid for an earlier ship.
4. **Explain the decisions.** Keep the failed attempts and tests that led to the result. Those often explain the difficult part better than a list of finished features.
5. **Credit the help.** Say what you built, what came from teammates, libraries or AI, and what you haven't tested yet.

Different builds need different evidence. [Project types](/docs/project-types) covers the files and demos for yours; [Submitting](/docs/submitting#outline) gives you an outline for bringing them together.

## Examples {#examples}

What does all of that look like in a submission? We'll start with a real project you can open, then walk through an invented sensor board. The board example includes a description, evidence and a journal entry, so you can see how each helps explain the others.

### A real project: Poorup {#poorup}

Jerry made [Poorup](https://poorup.tech), a multiplayer property-trading game in the browser. Its server checks player moves and lets players reconnect after dropping out. You can open the [public code](https://github.com/jeremy341/Poorup) to inspect the implementation and automated tests.

Jerry's example shows the payout math. **The team hasn't accepted this project for a payout**, so treat the numbers as an illustration:

| Part | Illustration |
| --- | --- |
| Time | About 100 hours. |
| Payout | 100 hours × 10 Ore = 1,000 Ore. |
| Catalog comparison | An enclosed printer at 1,045 Ore and an A1 Mini at 630 Ore, using working prices. |

Use the project as something to inspect, rather than a promise about your own payout. Each ship goes through the team's check, and catalog availability still needs to be confirmed.

### An invented example: a sensor board {#example}

**Tunnel monitor: a USB temperature and humidity logger.** The builder designed a two-layer board and wrote firmware that takes one reading per second, stores it in flash and lets somebody download the log over USB. That gives them Hardware work to explain, with Systems work in the logging and storage.

If this were your project, you might introduce the first version like this:

> I wanted to compare the temperature at my desk during the day, so I built a logger I could leave running without a computer. It reads the sensor over I2C and stores readings in a flash ring buffer. Connecting it over USB lets me download the log. Getting that download to work without interrupting sampling took longer than the initial sensor code; the journal below follows that bug.

Now the team has an idea of what you made. To let them check it, you'd include things like these:

| Evidence | What it lets a reviewer check |
| --- | --- |
| `board/` with schematic, layout and Gerbers | How the board is wired and what the builder designed. |
| `firmware/` and build/flashing instructions | The sampling, storage and USB implementation. |
| A parts list with quantities and suppliers | Which parts are custom and which are bought assemblies. |
| A short video warming the sensor in a hand while the log changes | That the assembled device produces readings. |
| An hour-long comparison with a reference thermometer | The temperature error under those test conditions. |

The last measurement supports a temperature claim, but it doesn't establish humidity accuracy. The builder should say that humidity was checked only at room conditions and that no enclosure is fitted yet.

They should also credit the unchanged vendor sensor driver and explain the AI help used for the serial parser, including the error handling they rewrote and tested. That gives the reviewer a way to distinguish their contribution from the code they started with.

### A sample journal entry {#sample-journal}

This is a fictional session from that project. The timings, measurements, commit ID and file paths illustrate what evidence could accompany an entry; they aren't links to real test results. Its length isn't a requirement.

> **Day 6 · 2 hours 40 minutes · Downloading a log without losing readings**
>
> I left the board logging overnight and the graph looked fine until I downloaded the data while it was still running. There were gaps around the download times. Since the whole point is to leave this taking one reading a second, I needed to find out whether the sensor was missing readings or the download was losing records.
>
> First I compared the stored timestamps with a small GPIO pulse I added around each sensor read. The pulse stopped while USB was sending, so the gaps were happening before the data reached the log. I had written the dump command as a loop that waited until the host accepted every byte. On my laptop, one of those waits kept the main loop busy for about 1.6 seconds.
>
> Before changing that loop, I tried raising the I2C clock. It cut the sensor transaction from roughly 1.8 ms to 0.5 ms, but the long gap was still there. That was useful to rule out, although I should have compared those timings with the USB wait before spending time on it.
>
> I replaced the blocking dump with a transmit queue. Each pass through the main loop now checks whether a sample is due before offering the next chunk to USB. The timer only sets a flag; the sensor read stays in the main loop. If USB can't accept data, sampling carries on and the download resumes on a later pass.
>
> For the check, I ran the board for 30 minutes and downloaded the log 50 times. It recorded all 1,800 readings, with the longest interval at 1.012 seconds. The graph is in `notes/day6-gaps.png`, the CSV is alongside it, and commit `a3f9c1` contains the change. This covers repeated downloads on my laptop; I haven't checked a very slow host yet. Next session I'll test that and look at what happens when the flash buffer wraps.

Notice how the entry follows the problem from finding the gaps to checking the fix. We can see why the builder changed the code, which attempt didn't help and what the final test actually covered. You don't need to write this much about every small change. Give the next person enough to follow what happened; [Tracking & evidence](/docs/tracking) has more on choosing what to record.

## Shipping again {#versions}

Want to keep working on it after the first ship? You can come back with another version once you have something new to show and **at least five new approved hours**. Tell us what's changed and include the journal entries since the last ship. That way, we can follow the new work without having to guess which parts you've already shown us.

Each accepted ship earns Ore at 10 Ore per approved hour. Twenty hours earn 200 Ore. If a later version adds twelve approved hours, that version earns another 120 Ore. The first payout stays as it was.

If we return a submission for fixes, correct the unpaid work and resubmit it in the same window. Your hours stay recorded; we still need enough evidence to approve them.
