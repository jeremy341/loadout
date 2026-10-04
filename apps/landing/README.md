# LOADOUT public landing

The LOADOUT public homepage lives in this Next.js application, adapted from the verified Pixl landing baseline. Its source audit and MIT provenance are recorded in `../../docs/source-audit/PUBLIC_SITE_PORT.md`. SVGs are authored for LOADOUT; self-hosted fonts include their OFL licenses.

Run `bun run dev` for development, or `bun run build` then `bun run start` for a production preview. Verification commands are `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run test:e2e`. `bun run capture` uses Node/Playwright to record desktop/mobile screenshots under the repository's ignored `.impeccable/review/final/` folder while a local server is running.

Copy `.env.example` for optional public HTTPS destinations. Missing Join/Login URLs produce working in-page actions. Indexing is disabled until an owned site origin and `LOADOUT_ALLOW_INDEXING=true` are supplied; Vercel previews remain noindex. The homepage explains planned program concepts and category previews. Participant, review, economy, and shop backends are outside this application.
