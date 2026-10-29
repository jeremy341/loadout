# Public Docs authoring

Public Docs answer a builder's questions about LOADOUT. Internal engineering instructions belong in docs/development, not the website.

## Single publishing source

Only flat `content/docs/*.md` files feed the website and public search. The filename is the canonical URL slug. Each file starts with:

```yaml
---
title: "Topic title"
description: "One clear sentence about the page"
group: "START HERE"
order: 10
status: draft
---
```

Groups are START HERE, BUILD & REVIEW, PROGRESS & PRIZES, COMMUNITY. Order is a unique positive integer; status remains draft while the program is unlaunched.

Use H2/H3 headings, Markdown links/lists, GFM tables and blockquote notes. No raw HTML, executable MDX or embedded internal plans. A heading can retain an old anchor with `## New title {#old-id}`. Duplicate explicit anchors, unsupported metadata, or broken Docs links fail validation.

## Public review gate

Check every factual claim against its owning plan. Plans 01/02 own product/economy, 11 Eras, and 15 IRL. A plan's draft value is not permission to publish it. If an owner explicitly approves showing a draft or working value, label it clearly as provisional wherever it appears; never present an unresolved final value as settled. Claims that a live service, registration, ordering, fulfillment or event is running require confirmation.

[Plan 02](../../plans/02-economy-and-rewards.md#rule-status-and-remaining-decisions) owns the current rule-status matrix. Internal age policy is 13 to 18, and the public Docs already state 13 to 18. Other public rules include the four tracks, Research Mode as a modifier, separate Ore/Track XP, fifteen lifetime levels, the four quality dimensions, the Ore rating baseline/floor/ceiling, the 15% level-discount maximum at LV.15, four identical 10% Requisitions at LV.5/8/11/15 with a 400-Ore minimum, a 25% combined cap, the LV.15 target, repeat-ship requirements and sample prices. Plan 11 records a planned 10% Era bonus. Intermediate XP thresholds and discount percentages stay in the internal calibration proposal until approved.

Unselected XP equations, Research bonus amounts, reviewer counts/duty/deadlines/aggregation, appeal limits, Custom Order tiers and cancellation terms remain internal candidates. A worksheet or old public sentence cannot approve them. A new decision must be recorded with its owner before publication.

Keep the general launch explanation in Start and Eligibility. Other pages describe settled mechanics directly, with a small link to program status rather than a repeated draft warning. An unresolved parameter may be named where it affects the answer, but do not state it as final. Keep the IRL event status once on its own page. Preserve `status: draft` metadata and do not imply that accounts, submissions, ordering, fulfillment or registration are running without confirmation. Working catalogs and examples are not stock or fulfillment commitments. Homepage edits are a separate scope.

## Writing and compatibility

Open with the takeaway. Use examples and tables when they reduce ambiguity. Separate fit, valid evidence and quality; distinguish personal progress from community progress. No coding tutorials or internal workflow explanations.

Retain the existing nine route slugs and useful anchors. New tracks/research/tracking/ai-teams/pricing/requisitions/custom-orders pages replace old redirects; other aliases continue to redirect. Check incoming anchors before renaming a heading.

The homepage copy stays independent during this Docs refresh; do not mutate it as a side effect of migrating the Docs FAQ.

## Verification and release feed

Run the standard checks in WORKFLOW.md. Docs tests validate metadata, navigation, links, aliases, headings and public-only search. Inspect wide desktop, narrow layouts and keyboard states.

After the main deployment is verified, generate a summary with:

```powershell
bun run docs:release-summary -- <previous-main-sha> <new-main-sha>
```

Maintainers manually post that summary to #loadout-docs. Link the deployed topics and mark the program as a draft. Questions go to #loadout-help. The feed is not a separately edited full-document mirror.

Follow [rivet-handoff.md](rivet-handoff.md) before changing bot sources.
