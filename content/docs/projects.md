---
title: "What can I build?"
description: "What belongs in LOADOUT, with examples to help you judge your idea."
group: "START HERE"
order: 30
status: draft
---

If you're wondering whether your idea belongs here, start by telling us what you'll actually build. A small command-line tool might solve a problem nobody has fixed for you, while an ordinary-looking app could hide a sync engine you spent weeks getting right. We need to see that work to understand the project, so give us more to go on than its name or a screenshot.

Accepted projects must be open source. Publish the source and relevant design files under an open-source license so other builders can inspect and use the work. Hardware ships must include their design files and a bill of materials.

## What makes a project fit? {#fit}

Start by explaining what you want the project to do, then tell us which parts you'll build or substantially improve yourself. Once you've built it, someone else should be able to inspect those parts and see the result. That's how we work out what you've contributed.

For example, “a notes app” tells us very little. “A notes app whose sync engine recovers after two devices edit offline” gives us a specific problem to look at. You could show the merge behavior, explain a conflict you had to resolve and include tests for losing the connection halfway through a save.

With that explanation, a reviewer can look at the problem you solved and the work behind it. They'll still need to review the actual implementation before approving it.

## The four tracks {#tracks}

| Track | The sort of work it covers |
| --- | --- |
| Tools | Debugging, testing, automation and things developers use to build. |
| Systems | Runtimes, protocols, storage and infrastructure. |
| Compute | Graphics, inference, numerical work and performance. |
| Hardware | Electronics, embedded systems, robotics and instruments. |

Pick the tracks that describe the work you actually did. A project can use several; [Tracks](/docs/tracks) explains how its XP is divided.

## Look for the technical core {#examples}

These comparisons show what to explain when an idea is borderline:

| What you've described | What we'd need to understand |
| --- | --- |
| A website built from a tutorial. | What you changed or built beyond the tutorial, and why it was substantial. |
| A screen around an AI API. | Any original runtime, evaluation, data-processing or other engineering you added and checked. |
| An ordinary app interface. | The technical work behind it, such as your own sync or rendering engine. |

Once the work fits LOADOUT, review considers **Originality, Technical Depth, Execution and Documentation**. A difficult implementation still needs evidence, and a polished demo still needs a contribution you can explain.

## Research Mode {#research}

What if your project is an investigation? Comparing algorithms, reproducing a paper or testing a hardware design can fit too. In that case, you'll need to show how you reached your answer and give other builders a way to check it. [Research Mode](/docs/research) explains what to include.

## Not sure your idea fits?

Ask in [#loadout-help](https://app.slack.com/client/E09V59WQY1E/C0C6XBLM0M7) before investing weeks in it. Describe the technical problem, what you'll build yourself and how you'll show it works. A sketch or small prototype can make that conversation much easier.
