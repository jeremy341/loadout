# Goose Lee

Goose Lee is a community duck bot for the `#loadout` Slack channel. It scores chat activity and thanks, turns scores into pond levels, and posts weekly and all-time top-three results that organizers confirm.

| Fact | Value |
|---|---|
| Owner | Kernel (community manager, per [`content/docs/team.md`](../../../content/docs/team.md)); **owner to confirm** for the repository |
| Repository | **Owner to confirm.** The 2026-10-20 audit found no remote configured for the local copies |
| Local checkout | `companions/goose-lee/` |
| Plan | Bot repository `docs/PLAN.md` (version 5). A newer version 6 exists only in the owner's parent workspace; **owner to confirm** which is canonical |

**How it connects.** There is no technical link by design. The bot does not use GitHub, Docs, Ore, hours or Track XP. It shares the LOADOUT Slack workspace and redirects program questions to Orry and `#loadout-help`. No API is exposed to LOADOUT.

Public wording: the community-side description is in [`content/docs/characters.md`](../../../content/docs/characters.md). The bot is not a program service and its points are not Ore.

## Contract checklist

- Do not add Goose as a submodule or copy its source into this repository.
- Do not commit its tokens, configuration or database here.
- If a LOADOUT character or channel change could affect its copy, tell the owner.
- Confirm which plan version is canonical before publishing or extending it.

Last verified: 2026-10-20.
