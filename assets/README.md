# LOADOUT assets

- `inbox/`: unapproved art and references awaiting review. The website does not import from here.
- `editable/`: Aseprite and original editable project files.
- `archive/`: distinct older or alternate LOADOUT art that should be retained for reference.
- `apps/landing/public/loadout/`: the single canonical location for images served by the website.

When artwork is approved for the website, move it from `inbox/` to its final path under `apps/landing/public/loadout/`, update `docs/design/asset-catalog.md`, update any source references, and remove the inbox duplicate. Do not copy or edit files inside the pinned `references/` repositories.
