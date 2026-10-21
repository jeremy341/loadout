# Related projects

These projects live in their own repositories or local source folders. This repository records that they exist, who owns them, and which of our files they depend on. It does not copy their code, data or secrets.

If a LOADOUT change could break one of them, read its page first. Items marked **owner to confirm** are not verified facts; do not publish them as such.

| Project | What it is | Local checkout | Repository | Relationship |
|---|---|---|---|---|
| [Orry](orry.md) | Slack help bot and its invite-only help-desk site | Companion folders, outside this repository | `NeticYTOF/orry` (bot). The site has no repository yet | Answers from the Docs; Docs source integration proposed; shares the Orry character |
| [Goose Lee](goose-lee.md) | Community duck bot for the LOADOUT Slack | Companion folder, outside this repository | `jeremy341/community-slack-bot`, branch `feat/goose-lee-v6` | Shared people and Slack channel; no code link |
| [Mole art](mole-art.md) | Source art and frame pipeline for the homepage mascot | `assets/editable/mole/` (kit) and the owner's art workspace | This repository (kit); raw sheets stay local | Builds the atlas shipped in `apps/landing` |

Rules:

- Do not add a companion project as a submodule or vendor its source here.
- Do not commit bot tokens, `.env` files, databases, browser profiles or traces.
- Keep each project's plan in its own repository. These pages link to it; they do not copy it.
- Update the page and its "last verified" date when a contract, owner or repository changes.

Last verified: 2026-10-21.
