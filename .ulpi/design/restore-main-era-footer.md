# Restore main's Era and footer revision panel

Status: owner-approved bounded restoration, 2026-10-16. Source: freshly fetched `origin/main`, commit `16ed4c3`. User explicitly limits this change to Era and footer; no other audit findings or prize strip changes.

## Design read and scope

Preserve LOADOUT's industrial field-manual identity, themes, type, motion and responsive behavior. Restore the existing main implementation, not a redesign. The current Era component already matches main; missing CSS declarations broke its centered two-column facts panel. Restore the exact main declarations that support that panel and its existing Era connector entrance. Scope the two-column rule to Eras so unrelated rows are unaffected.

Restore the complete `ft-sheet` metadata block from main (Project, Sheet, Rev, Year, Status) so the original two-column cell/border pattern works again. Existing footer CSS matches main. Keep current footer text, navigation, direct community/help links, team link and Orry controls outside this block.

## Behavior and accessibility

No new controls, states or assets. Keep main's existing mobile stacking, reduced-motion rules, semantic description list and decorative Era art. Match main's component and relevant CSS declarations; do not copy all of home.css or SiteFooter.tsx over the newer page. Preserve all other work. All seven UI skills have been consulted this session; no new vector, sprite or motion design is needed.

## Acceptance and handoff

The Era facts are centered at main's width with two equal joined columns on desktop and main's existing narrow-screen behavior. Footer metadata has main's exact markup with intact borders. Compare restored snippets against the fetched main commit, run focused lint/type checks, and inspect local desktop/mobile views. No test suites, commits, pushes, deployment or Slack messages.

Engineering owner: GPT-6 Luna at medium reasoning. Implement exactly this spec in apps/landing/app/home.css and apps/landing/app/_components/home/SiteFooter.tsx. Main's Eras.tsx is already identical, so do not manufacture an edit. Parent handles verification.

## Local verification

Restored locally. Era component matches fetched main after line-ending normalization; the footer metadata block matches main exactly. Era facts measure 900px total with two equal 450px columns at a 1280px viewport, and one 312px column at 375px. The footer panel is in normal flow on mobile. The current shorter footer introduction requires a 160px desktop minimum height so the restored metadata clears the links divider; measured clearance is 42px. Focused footer ESLint, typecheck and `git diff --check` pass. Preview uses the existing consolidated server at http://localhost:3000/. Captures are outside Git under `reports/restore-main-era-footer-2026-10-16/`. No tests, commits, pushes, deployment or messages.
