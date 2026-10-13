# Netics handoff: Rivet public Docs source

This repository implements the public Docs source. Netics owns changes to Rivet configuration/runtime and automated Slack delivery; those are a separate integration after the Docs deployment is verified.

## Current read-only audit

Checked 2026-10-10 against [Rivet main](https://github.com/NeticYTOF/rivet/commit/e2d2456834c204f7e4be29643527239d68a60571). Its [LOADOUT config](https://github.com/NeticYTOF/rivet/blob/e2d2456834c204f7e4be29643527239d68a60571/loadout/program.json) still points to `loadout-jerry-team1.vercel.app`, while LOADOUT's stable domain is `loadout-ysws.vercel.app`. It lists nine local corpus entries and old channel IDs. Its pinned facts include the four tracks, Ore versus Track XP, level caps, Requisition milestones, and Custom Order tiers; reconcile every numeric or readiness claim with the public-content gate before refreshing them.

The current config says `posture: active` and `status: sandbox`, which communicate different readiness states. Its copy also describes LOADOUT as active in the program name and calls the makers “the org behind it.” Keep the bot's user-facing wording aligned with the website's program-draft status and confirmed organizer roles. The adjacent [README](https://github.com/NeticYTOF/rivet/blob/e2d2456834c204f7e4be29643527239d68a60571/loadout/README.md) says seven corpus sources are resolved and lists an eighth `08-public-copy.md` as reference-only; the config currently lists nine sources including `09-people.md` and `10-eras.md`. Resolve this source-count mismatch in the bot repo.

This website repository does not update Rivet's configuration, sources, runtime, Slack scope, or pinned rules. Netics owns that separate handoff. Verify the latest Rivet source implementation before selecting a GitHub directory source; the previous `github-dir` behavior finding was from an older commit.

## Proposed source

```json
{
  "name": "LOADOUT public docs",
  "type": "github-dir",
  "url": "https://api.github.com/repos/jeremy341/loadout/contents/content/docs?ref=main",
  "siteUrl": "https://loadout-ysws.vercel.app/docs"
}
```

Use only the flat public `content/docs/` directory, never `plans/`, `docs/development/`, source audits or submodules. Filenames match published slugs. Keep the GitHub repository canonical; do not make Slack a replacement authority. Confirm that the current Rivet commit supports this source mode before changing the bot configuration.

## Integration checklist for Netics

1. Wait for the new main deployment and verify every public topic/source URL.
2. Update the website destination and configure the source in a staging-safe way.
3. Reconcile pinned rules and old corpus values with public Docs, especially unpublished AI limits, Custom Order tiers and economic calibration. Otherwise pinned rules can contradict the new source.
4. Refresh knowledge and check answers for tracks, XP/Ore, Eras, Requisitions and Custom Orders, including citations and pending-value questions.
5. Remove or disable copied LOADOUT corpus sources only after parity is verified; preserve unrelated knowledge.
6. Preserve existing channel scope and intentional DM silence. Do not add ambient reply behavior with this source change.
7. Report deployed commit, refreshed-source evidence and remaining gaps.

## Manual Slack feed first

#loadout-docs holds a pinned Docs index plus one summary per verified Docs release. Maintainers paste the generated summary; #loadout-help remains the question channel. Bot ingestion and posting automation are not deployed by this repository change.

The public feed was created on 2026-10-07 as `C0C7L0HH109`. Its [canonical index post](https://hackclub.slack.com/archives/C0C7L0HH109/p1791396507540619) is pinned. This is channel setup evidence, not proof that Rivet ingests it or that the new Docs release is deployed.

The feed must not imply Rivet has already refreshed. Avoid running a bot refresh concurrently with an incomplete Vercel deployment.
