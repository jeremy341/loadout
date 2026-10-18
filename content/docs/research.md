---
title: "Research Mode"
description: "Ship an experiment, benchmark or finding that somebody else can reproduce."
group: "START HERE"
order: 50
status: draft
---

You changed an algorithm, ran the benchmark and got a faster result. Before calling it an improvement, you run it again. This time it's slower. Was the first result luck, a warm cache, or a real difference you haven't isolated yet?

That's the sort of question Research Mode is for. You investigate it, keep the evidence and ship what you found, including enough detail for another builder to check it. The work still belongs to Tools, Systems, Compute or Hardware; Research Mode describes the kind of project you're doing.

## What makes it research?

Begin with a question you can test. “Can I make this faster?” is a starting point; “Does this buffer layout reduce memory use under the same workload?” gives you a comparison you can actually run.

Write down the inputs, versions and conditions, then decide what you'll measure. Keep those conditions consistent when comparing approaches. If you change several things at once, it becomes much harder to explain which change produced the result.

## What should I send? {#what-to-include}

Your submission should let another builder follow the investigation:

1. **The question.** What were you trying to find out, and what did you expect?
2. **The method.** Inputs, environment, versions and steps to repeat the comparison.
3. **The evidence.** Measurements, correctness checks, failed attempts and anything you excluded, with the reason.
4. **The result.** What the evidence supports, what surprised you and what remains uncertain.
5. **The files.** Code, designs, data or instructions needed to reproduce it, with credit for existing work.

Let's go back to the buffer comparison. Someone looking at your graph might want to try it on their own machine, so include the workload and raw measurements too. They can then run the same comparison and see whether the improvement holds, or whether something about your test conditions explains it.

## Negative results count if you explain them

What if your new approach turns out slower? That's still something worth explaining. Show us how you reached the result and what you ruled out. Keeping the runs that disagree with your original idea lets someone else follow the investigation, and might help them avoid the same dead end.

An abandoned attempt still needs enough investigation and evidence to stand on its own. Explain what you learned from the failure and where the limits of that finding are.

## Review and progress

Keep tracking and journaling while you investigate. Research goes through the usual fit, authorship, evidence and quality checks, so the [shipping checklist](/docs/shipping#checklist) still applies.

Reproducible research can earn extra Track XP. We're still deciding the amount and the full qualification rules, so we can't give you a bonus calculation yet. For now, [Project review](/docs/review) explains how we'll check the work itself.
