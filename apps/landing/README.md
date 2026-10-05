# LOADOUT public landing

The LOADOUT public homepage lives in this Next.js application, adapted from the verified Pixl landing baseline. Its source audit and MIT provenance are recorded in `../../docs/source-audit/PUBLIC_SITE_PORT.md`. SVGs are authored for LOADOUT; self-hosted fonts include their OFL licenses.

Run `bun run dev` for development, or `bun run build` then `bun run start` for a production preview. Verification commands are `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run test:e2e`. `bun run capture` uses Node/Playwright to record desktop/mobile screenshots under the repository's ignored `.impeccable/review/final/` folder while a local server is running.

Copy `.env.example` for optional public HTTPS destinations. The confirmed draft RSVP is the default Join destination; an explicit blank/unsafe override disables it and restores working section actions. Login stays configured-only. Indexing requires an owned site origin and `LOADOUT_ALLOW_INDEXING=true`; Vercel previews remain noindex. The homepage explains planned concepts and category previews; participant/review/economy/shop backends are outside it. Browser tests use two workers to keep memory use bounded.
