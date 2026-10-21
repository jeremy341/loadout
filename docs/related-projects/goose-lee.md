# Goose Lee

Goose Lee is a community duck bot for the `#loadout` Slack channel. It scores chat activity and thanks, turns scores into pond levels, and posts weekly and all-time top-three results that organizers confirm.

| Fact | Value |
|---|---|
| Owner | Kernel (community manager, per [`content/docs/team.md`](../../content/docs/team.md)); **owner to confirm** |
| Repository | `https://github.com/jeremy341/community-slack-bot`, branch `feat/goose-lee-v6` (the official working branch) |
| Local checkout | A companion folder outside this repository, with the same branch |
| Plan | Version 6 is the current plan. The bot repository's `docs/PLAN.md` still holds version 5; **owner to confirm** when the repository is updated to match |

**How it connects.** There is no technical link by design. The bot does not use GitHub, Docs, Ore, hours or Track XP. It shares the LOADOUT Slack workspace and redirects program questions to Orry and `#loadout-help`. No API is exposed to LOADOUT.

Public wording: the community-side description is in [`content/docs/characters.md`](../../content/docs/characters.md). The bot is not a program service and its points are not Ore.

## Contract checklist

- Do not add Goose as a submodule or copy its source into this repository.
- Do not commit its tokens, configuration or database here.
- If a LOADOUT character or channel change could affect its copy, tell the owner.
- Confirm which plan version is canonical before publishing or extending it.

Last verified: 2026-10-21.
