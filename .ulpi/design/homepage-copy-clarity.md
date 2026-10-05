# Homepage copy clarity — 2026-10-05

Approved request: make the explanations easier to understand. Bind to DESIGN.md and Plan 12; keep the existing layout, hero headline, assets, styles, animations, links, semantics, and program rules.

## Writing direction

Use a friendly, direct voice for someone arriving with no knowledge of LOADOUT. Explain what the builder does, what they receive, and how they use it. Define a term before relying on it. Prefer “discount on gear in that track” to “eligible field pricing,” “maximum saving” to an unexplained “cap,” and “share your project” to an unexplained “ship.” Keep required limits clear without repeating concept-status wording in every paragraph.

Bolts pay for rewards. Track XP raises a separate level in each of the four tracks. A project can earn XP in several tracks; reviewers assign it according to the actual work. Higher levels can improve relevant equipment pricing and unlock access requirements. Leveling does not itself multiply Bolt awards. The Digital Loadout is the portfolio of accepted projects; the Physical Loadout is equipment used to build.

Requisitions raise the normal savings limit on eligible gear, letting a builder use more of their already-earned track discount. Explain this with a conditional, word-only GPU/Compute example: the earned discount exceeds the item's normal maximum saving; a matching Requisition raises that limit; the builder pays the remaining price in Bolts. No invented numbers or stock. Five lifetime milestone awards per track, one use, never expires, no transfer, max one per order, minimum item values, no bypassing level gates.

Custom Orders are requests for suitable technical gear outside the catalogue. Explain request → team checks fit/level/Bolts/region/budget → approved quote → builder decides. A quote is the approved item and Bolt price. No active form or fulfillment promise.

Eras are shared program themes. Approved projects add separate community points toward the next Era. Objectives are optional build ideas across tracks. Advance at a weekly scheduled check only after 14 days and the community target; otherwise stay in the same Era. Personal progress persists. Seasons concern competitive rankings. Keep the illustrative sequence labeled; no live counters or numeric bonus.

## Scope and handoff

Engineering edits only the visible strings in site-content.ts, HomepageSections, DigitalPhysicalLoadout, HowItWorks, ProgressionSection, ErasSection, EquipmentSection, SiteFooter, and FinalCTA. Preserve markup structure, CSS classes, IDs, icon names, behavior and destinations. Hero headline remains unchanged; its support sentence may be clarified without altering line structure. Keep public setup status near About/FAQ/RSVP.

Acceptance: a first-time reader can distinguish XP/Bolts, understand why tracks/levels matter, explain a Requisition's benefit and limits, and follow Custom Orders/Eras without already knowing their vocabulary. Keep short card copy compact. FAQ should answer actual questions, including rewards and Custom Orders. Text may wrap naturally at small widths; no fixed heights or new interactions. Copy remains readable without scripts. No automated tests, CI, dependencies, publishing, or product-policy changes.

Skills: copywriting for plain language; the seven existing UI skills preserve the locked visual system and specialist motion/SVG/pixel assets. No new art or animation is needed. Delegate the string-only implementation to the existing GPT-6 Luna medium content agent, then review it against Plans 01/02/11 and inspect the page.


## Implemented copy revision

Rewritten locally: About and overview, the four term definitions, process, track descriptions and project-fit examples, progression benefits, Requisition example and limits, Custom Order steps, Era explanations, FAQ, footer, and final RSVP support. The hero headline remains unchanged; its support sentence now names Bolts and Track XP directly. Layout, assets, styles, animation, section IDs, and destinations are unchanged from the approved refinement.

A Requisition example uses a Compute discount on a GPU to explain the normal savings limit and the effect of raising it, without invented prices. Bolts are explicitly each builder's balance across tracks. Higher Requisition grades and lifetime scarcity are explained. Review criteria, team attribution, AI help, research, and unpublished launch details remain covered.

Manual browser review: default desktop viewport and 390/320px viewport overrides, including Requisition text and expanded Custom Order FAQ. Document width matches the available viewport width at both mobile sizes; visible text wraps in its containers. Viewport override was reset. Local captures are .impeccable/review/copy-clarity/equipment-desktop.jpg and equipment-mobile.jpg (ignored review artifacts). No automated tests, CI, or build/check suite ran for this string-only revision; git diff --check passed. Nothing was committed, pushed, or deployed.
