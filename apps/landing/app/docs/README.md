# LOADOUT participant docs

Scope: apps/landing/app/docs and docs-specific rules in apps/landing/app/docs.css.

These pages help prospective builders understand LOADOUT, choose technical projects, prepare a ship, understand review, and learn how Track XP, Bolts, prizes, Requisitions, Custom Orders, Eras, and Seasons connect.

Keep the existing docs layout, neutral grey sidebar, yellow current-page marker, homepage paper grid, and accessible navigation. Write enough detail to explain a participant decision without exposing repository workflow, code architecture, source audits, internal budgets, bootstrap prompts, or planning archives.

Scrolling stays inside the docs shell: the sidebar, guide pane, and desktop table of contents scroll independently only when their content exceeds their viewport. On small screens, the topic list is bounded and the guide uses the remaining height. The browser page itself must not grow with a long guide; the focused guide pane supports Page Up/Down and reduced motion.

Use the local canonical product, economy, and Era plans when maintaining the guides. Keep original project documents in their repository locations; do not publish the entire planning bundle through the participant docs. Unconfirmed dates, prices, eligibility, and request availability remain explicitly unconfirmed.

Verify public navigation, direct routes, removal of internal source routes, mobile reflow, keyboard access, and compile checks. Preserve all non-docs changes in the working tree.
