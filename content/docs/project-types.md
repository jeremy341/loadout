---
title: "Project types"
description: "The files and demos to include for software, hardware, web apps, mobile apps and games."
group: "BUILD & REVIEW"
order: 63
status: draft
---

The files and demo we need depend on what you've made. We can open a web app through a URL, but a circuit needs a demonstration of the actual device. Find the sections that fit your build below, then use the [shipping checklist](/docs/shipping#checklist) to bring everything together.

## Software {#software}

For software, the first question is whether someone else can run it. Follow your README from a clean checkout before shipping and see how far you get. That's often when you find the package you installed globally months ago and forgot anyone else would need.

- Include source we can open, with a clear license and the setup commands.
- Name the runtime, language and operating-system versions that affect the build.
- Show the main behavior through a demo, release, terminal session or reproducible output.
- Include checks that support your claims, and explain the inputs and conditions for any measurements.
- Credit dependencies and help, and describe the parts you haven't tested.

Building a library or a CLI? You don't need to add an app interface just to show it off. Give us a small example we can run and the output we should expect. If the point is to make something faster, check that the output is still correct before comparing the timings.

## Hardware {#hardware}

For hardware, help us follow the design through to the device you built. A render can explain how an enclosure fits together, but we'll also need to see the real circuit or mechanism doing its job. Here's what helps us check both:

| Include | Make sure it shows |
| --- | --- |
| Original schematics, layouts, CAD and viewable exports | What you designed and how the parts fit together. |
| Firmware and flashing instructions | What runs on the device and how to build it. |
| A parts list with quantities and sources | Custom parts, bought modules and the materials needed to reproduce it. |
| Photos and a working demonstration | The real assembly, its connections and its output. |
| Tests or measurements | What you checked, under which conditions and what happened. |

If you fixed a board with a jumper wire, show the fix and update the design files to match. Someone building the published version shouldn't have to rediscover the same fault. Say clearly which parts are simulated, unfinished or untested.

## Web apps {#web}

Give us a deployed URL, the source and the setup instructions. A recording of the main feature helps explain what to try, especially when the interesting work happens behind the interface.

Point reviewers to that work. If you wrote offline synchronization, demonstrate losing the connection and reconnecting, rather than only showing the sign-in page.

## Mobile apps {#mobile}

Include a recording on a real phone or a test build somebody can install, along with the platform and build tools. Explain the implementation behind the screens too: storage, device APIs, networking or whichever parts took substantial work.

## Games {#games}

Provide a playable build or a video that demonstrates the version you're shipping. List the engine version so someone can open the source, and credit art, music and other assets with their licenses. Then point out your own systems, scripts or levels so reviewers can follow your contribution.
