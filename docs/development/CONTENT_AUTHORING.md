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

Check every factual claim against its owning plan. Plans01/02 own product/economy,11 Eras,15 IRL. A plan's draft number is not permission to publish a price, threshold, formula or schedule.

Already-approved public invariants include the four tracks, Research Mode as a modifier, separate Bolts/Track XP, fifteen lifetime levels, the four quality dimensions, and Field Requisition milestones3/6/9/12/15. Exact prices, XP rates, score/multiplier calibration, Custom Order tier values, Era point formulas/thresholds/bonus configuration, dates and personal eligibility remain unpublished.

These pages describe intended mechanics, not functioning submission/order/registration systems. Keep the status clear. Re-read source claims, not just the current website, when changing wording.

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

Follow [RIVET_HANDOFF.md](RIVET_HANDOFF.md) before changing bot sources.
