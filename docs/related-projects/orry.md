# Orry (bot and help-desk site)

Orry is the LOADOUT Slack help character: a bot that answers program questions from the public Docs, and a separate invite-only site that shows its tickets and statistics. The bot and site share a name and visual identity; they are separate codebases.

## Bot

| Fact | Value |
|---|---|
| Purpose | Answers builder questions from the LOADOUT Docs; hands unresolved questions to human helpers |
| Owner | Netic (co-organizer). **Owner to confirm** the current maintainer |
| Repository | `https://github.com/NeticYTOF/orry` (the official repository). The Docs team page links to it |
| Local checkout | A companion folder outside this repository. Its history is Rivet-derived, and its work branch is local and unpushed |
| Plan | Bot repository `AGENTS.md`, `HANDOFF.md` and `docs/ORRY.md`; this repo keeps the Docs-source handoff in [`docs/development/rivet-handoff.md`](../development/rivet-handoff.md) |

**How it connects.** The deployed bot reads a copied corpus today. A proposed GitHub directory source would read `content/docs/` directly; that source is not confirmed as deployed. Keep the folder flat, keep filenames stable, and do not rename a public Docs file without telling the bot owner: the filename is the indexed slug.

Public wording: the Orry persona is described in [`content/docs/characters.md`](../../content/docs/characters.md) and the team in [`content/docs/team.md`](../../content/docs/team.md). The bot is not a LOADOUT service and has no Ore, XP or eligibility authority.

## Help-desk site

| Fact | Value |
|---|---|
| Purpose | Read-only view of open tickets, closed-ticket statistics and a leaderboard, behind invite-only sign-in |
| Owner | **Owner to confirm** |
| Repository | None yet. The source has no Git history |
| Local checkout | A companion folder outside this repository |
| Plan | The site plan in the owner's workspace (`reports/orry-site-plan-2026-10-19/PLAN.md`, not versioned here) |

The site reads the bot's read-only bridge with a read-only token, signs in through Hack Club Auth and is planned for Hack Club Nest. It copies LOADOUT design tokens and the mole atlas by value, so token or sprite changes do not propagate automatically. It is not part of this repository and is not deployed by LOADOUT.

## Contract checklist

- Keep `content/docs/` flat; filenames are slugs.
- Keep the 25-file Docs count test and frontmatter fields intact.
- Do not rename or move a public Docs page without telling the bot owner.
- Never commit the bot's tokens, the site's database, `.env` files or invite data here.
- Vey (the decision model) is an optional bot dependency, currently reported as disabled. Public copy that says it powers Orry needs owner confirmation before it is repeated.

Last verified: 2026-10-21.
