# Public review queue

Port the public ReviewQ interface from Eraxty/ReviewQ at e0cf9d30660e24dcfdb6203b92771d0a45c7fad5 with reuse permission confirmed by the LOADOUT owner. Preserve the responsive layout, theme switch, search, queue tabs and shareable positions. Use LOADOUT review records and show availability errors. Publish only project titles, public handles, track, queue number and ship timing. Preserve keyboard search and reduced motion. Check oldest-first ordering, final checks and deep links. The reviewer desk has no top-15 limit, so the public queue shows actual positions without a cutoff.
## LOADOUT integration

Use the participant shell for builders and its plain frame for visitors. Keep the public route and shareable search. Use the existing paper and graphite tokens, pixel headings, square controls, and thin rules. The title leads into one pipeline readout, then the search and two queues. On phones controls wrap and rows reflow. Keep keyboard search, live feedback, empty states, and the shared display preferences. Put Review Queue under Build and link active ships to the matching queue and project number. Keep Eraxty attribution in the footer.

Audit pass (2026-11-19, brief `ui-audit-public.md`): the search comes first, the overview is a quiet summary, and the Software and Hardware toggles are two equal-size buttons. The visitor frame has Home and Docs in the header with the Accessibility tab, and "How review works", "Browse the Docs" and "Back to LOADOUT" before the Eraxty line.
