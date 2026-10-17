# Community channel links

Status: owner-approved local implementation, 2026-10-16. The owner explicitly forbids sending messages; no Slack kickoff or post is authorized.

## Design read

Keep the existing industrial field-manual UI. This is a bounded navigation fix: turn the existing community/help references into usable links, without new artwork, motion, layout or product claims. The seven required UI skills were consulted in this session; vector, sprite and animation creation do not apply.

## Verified destinations

Read-only local-browser verification in Hack Club Slack:

- #loadout: https://app.slack.com/client/E09V59WQY1E/C0C5XUDMRH9
- #loadout-help: https://app.slack.com/client/E09V59WQY1E/C0C6XBLM0M7

Use normal HTTPS channel links. They open Slack's normal sign-in/channel flow and do not post or automatically join a channel. Do not expose message contents or private account information in the public site.

## Scope and interactions

- Give site configuration a verified default community URL, preserving its existing HTTPS validation and explicit override/disable semantics.
- Replace the footer's generic Slack destination with Join #loadout. Offer #loadout-help with the existing footer link styling.
- Make the homepage FAQ's existing #loadout-help mention a semantic anchor. Preserve its words, accordion state, animation, closed-panel inert behavior and no-script answer.
- In public Markdown, link every existing #loadout-help mention to the verified help URL. Do not alter other channel references or internal workflow documents.
- Keep same-tab navigation, existing link/focus styles, normal keyboard activation and mobile wrapping. No confirmation/loading/error UI is needed for a normal external link. Browser Back returns to LOADOUT.

## Acceptance and handoff

The footer, expanded FAQ and public Docs expose real anchors with recognizable labels. No message, reaction, invitation, membership action, commit, push or deployment. Use focused lint/type and public-content link checks; no test suites were requested.

Implementation owner: GPT-6 Luna, medium, Next.js engineering agent. Implement exactly this scope using the existing design system; do not redesign its components. Parent owns public Markdown; engineering owns site configuration and homepage components. Preserve unrelated work.

## Local verification

Implemented locally. Typecheck and focused ESLint pass. All 18 public Docs pages parse and internal links validate; `git diff --check` passes. Browser readback confirms both footer destinations, the expanded FAQ help anchor, and Help & feedback's linked mentions. The footer screenshot is saved outside the repository under `reports/community-links-2026-10-16/`. No test suites, Slack messages, commit, push or deployment.
