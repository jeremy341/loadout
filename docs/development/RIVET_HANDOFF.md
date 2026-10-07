# Netics handoff: Rivet public Docs source

This repository implements the public Docs source. Netics owns changes to Rivet configuration/runtime and automated Slack delivery; those are a separate integration after the Docs deployment is verified.

## Audit evidence

Read-only GitHub inspection of NeticYTOF/rivet main at `493c31a7aa065d366919bb374cd623a259d9d4fe` found nine copied Markdown corpus sources in loadout/program.json, an outdated loadout-jerry-team1.vercel.app URL, and pinned numeric rules that must be checked against the current public content gate.

Its existing github-dir source supports a flat GitHub contents listing paired with siteUrl. In that mode it fetches and cites the corresponding published webpage. Verify behavior against the latest Rivet commit before configuring it.

## Proposed source

```json
{
  "name": "LOADOUT public docs",
  "type": "github-dir",
  "url": "https://api.github.com/repos/jeremy341/loadout/contents/content/docs?ref=main",
  "siteUrl": "https://loadout-ysws.vercel.app/docs"
}
```

Use the flat public directory, never PLAN, docs/development, source audits or submodules. Filenames match published slugs. Do not add Slack as a replacement authority.

## Integration checklist for Netics

1. Wait for the new main deployment and verify every public topic/source URL.
2. Update the website destination and configure the source in a staging-safe way.
3. Reconcile pinned rules and old corpus values with public Docs, especially unpublished AI limits, Custom Order tiers and economic calibration. Otherwise pinned rules can contradict the new source.
4. Refresh knowledge and check answers for tracks, XP/Bolts, Eras, Requisitions and Custom Orders, including citations and pending-value questions.
5. Remove or disable copied LOADOUT corpus sources only after parity is verified; preserve unrelated knowledge.
6. Preserve existing channel scope and intentional DM silence. Do not add ambient reply behavior with this source change.
7. Report deployed commit, refreshed-source evidence and remaining gaps.

## Manual Slack feed first

#loadout-docs holds a pinned Docs index plus one summary per verified Docs release. Maintainers paste the generated summary; #loadout-help remains the question channel. Bot ingestion and posting automation are not deployed by this repository change.

The public feed was created on 2026-10-07 as `C0C7L0HH109`. Its [canonical index post](https://hackclub.slack.com/archives/C0C7L0HH109/p1791396507540619) is pinned. This is channel setup evidence, not proof that Rivet ingests it or that the new Docs release is deployed.

The feed must not imply Rivet has already refreshed. Avoid running a bot refresh concurrently with an incomplete Vercel deployment.
