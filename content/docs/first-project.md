---
title: "Build your first project"
description: "Pick something small, set up your records, and get a first version ready to ship."
group: "BUILD & REVIEW"
order: 61
status: draft
---

For your first project, pick one job you'd like it to do. Let's say you keep making the same mistake in a configuration file. A tool that catches that mistake gives you something small enough to build, test and ship. You can add more checks later, once you've seen the first version work.

## Before you start {#before}

Before opening your editor, write down what would make that first version useful. For the configuration checker, reading one file format and reporting the error might be enough. You don't have to support every format or build an interface before someone can try it.

Make a project folder and set up [Git](/docs/git) so you can keep checkpoints as you go. Read the [tracking setup plan](/docs/time-setup) too, and start taking notes from your first session. A short note written today will be much more useful than trying to reconstruct the whole week before shipping.

## The five steps {#steps}

1. **Choose the first result.** Describe what somebody should be able to do with your version and which [tracks](/docs/tracks) the work uses.
2. **Get it working.** Build that version, test it with realistic input and keep the failures in your journal. They explain how you reached the result.
3. **Let someone else try.** Put the source or design files in order and write the setup steps. For software, try those steps from a fresh checkout; for hardware, show the device doing its job.
4. **Explain your part.** Point out the decisions that took work, credit anything you reused and say what still needs fixing.
5. **Check the ship.** Follow [Build & ship](/docs/shipping#checklist), then use the [submission outline](/docs/submitting#outline) to gather the links and evidence.

You can continue after the first ship. A later version needs new work and at least five new approved hours; it doesn't need to become an entirely different project.

## What if I get stuck? {#stuck}

You can ask in [#loadout-help](https://app.slack.com/client/E09V59WQY1E/C0C6XBLM0M7) while you're building. Try to share a small example of the problem, along with what you expected and what you've already tried. You don't need to know which part is broken to ask for help, but that context gives the next person somewhere to start.
