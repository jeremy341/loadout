# Mobile responsiveness repair

Scope: homepage layout only, based on the supplied Research Mode screenshot.
Keep the locked paper/pixel design, copy, assets, motion and product behavior.

Flow: open the homepage on a phone, scroll through Tracks and Research Mode,
then use navigation and FAQ without clipping, overlapping labels or narrow copy.

Research Mode uses a flexible text column beside its existing icon. Its status
occupies a separate row below the copy when the viewport is 900px or narrower;
on phones the description and status use the full panel width. Desktop retains
the inline status with bounded width and natural wrapping.

Acceptance: inspect 320, 360, 390, 471, 640, 700, 701, 768, 900, 901 and 1440px.
The heading and status must not overlap, descriptions stay readable at 16px,
and no content escapes a panel or introduces horizontal page scrolling. Preserve
keyboard navigation, FAQ states, native touch scrolling and reduced motion.
Check neighboring layouts; change them only if a specific defect is reproduced.

Preflight: read AGENTS.md, WORKFLOW.md, UI_SKILLS.md and locked DESIGN.md.
Loaded design-taste-frontend, frontend-testing-debugging and vercel-cli.
The six other named UI skills are unavailable in this environment; no SVG,
sprite, animation or design-system changes are in scope. No collaborator message
was sent because the user authorized code and preview work, not messaging.
Preview first; no pull request or production promotion before user review.
