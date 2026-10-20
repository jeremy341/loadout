# Sources for the Explore, Ideas, Show & Tell and Friends tabs

Folder: `apps/platform/components/pages/community-a`. Branch `feature/platform-shell`. Every feature here is a browser-only preview: state lives in `localStorage` through `lib/preview-store.ts` (keys start `comm.`), sample content is invented, and nothing is sent to LOADOUT.

## Policy sources (rules taken from the plans)

| Rule | Source |
| --- | --- |
| Builder friends and follows, likes, post notifications, comments, project discovery, public idea board with upvotes, Show & Tell are selected | `plans/proposals/future-platform-ui.md` ("Social and community"); `plans/01-product-and-program.md` sections 53 and 54 |
| Avoid an endless-scrolling generic feed, engagement farming and follower obsession; reposts are not selected | same two files. Implemented as paged lists with explicit Previous / Next page buttons and a 10-event activity list |
| Project pages and journals are public by default; Lapse recordings are visible only to reviewers | `plans/proposals/future-platform-ui.md`; `plans/01-product-and-program.md` 6.7. Shown as a note on Hardware projects in Explore |
| Never publish keys, credentials, private addresses or personal information | `plans/01-product-and-program.md` 6.7. Used in the community conduct line |
| No open-world game, no shop suggestions or voting | `plans/proposals/future-platform-ui.md` "Deferred, excluded". Nothing of the kind is built |
| Moderation and abuse handling for community surfaces | Required by the task brief, not specified by a plan. Implemented as report (reason, stored locally), hide for me, block builder, delete own content |

## Reference files read

Reading only; no source file was copied. LOADOUT's version is written from scratch for React and the LOADOUT design system.

| Reference path | Licence | What was taken |
| --- | --- | --- |
| `references/pixl/apps/game/web/ideas/index.html` | MIT (Pixl) | Behaviour pattern only: newest-first and top-voted orderings; one upvote per person per idea shown as a pressed button with a count; compose box with a title and an optional description. Pixl's downvotes, collaboration roles, hours and image attachments were not taken |
| `references/pixl/apps/game/web/explore/projects/index.html` | MIT (Pixl) | Behaviour pattern only: a project board with a link to a project detail page. LOADOUT keeps the detail view in the same page and in the location hash (`#project-<id>`) so Back works and a link can be shared |
| `references/pixl/apps/game/web/show-n-tell/index.html` | MIT (Pixl) | Pattern only: a list of showcase entries ordered by votes. Pixl's voting rounds and round timer are not used |

Pixl game, currency and world mechanics were not ported.

## Draft preview rules

The plans select these features but do not settle the values below. They live in one object, `logic/rules.ts` (`DRAFT_RULES`), and the pages label them "Draft preview rule".

## Unsettled by the plans

These are gaps. Each needs a policy owner before a real service. The preview values are placeholders, not proposals.

1. **Comment length and posting limits.** Plans name comments but give no length. Preview: 500 characters; 20 comments per hour.
2. **Idea limits.** Title at most 80, description 10 to 600 characters, 5 new ideas per day (counted from the saved timestamps of your own ideas).
3. **Idea statuses.** Plans give no status model. Preview: Open, Planned, Done, Withdrawn. Planned and Done appear on sample ideas only. A participant can withdraw or reopen only their own idea and can never set Planned or Done. Who may mark ideas Planned or Done is undecided. The Ideas preview tool that moves a sample idea to Planned is a simulation, not a rule.
4. **Idea board versus "collectibles".** The proposal pairs the idea board with "upvotes and collectibles". How an idea relates to a collectible is not specified; nothing is built for it here.
5. **Show & Tell format.** Plans list Show & Tell (and, in Plan 01, event Show & Tell) without fields. Preview: title (80), what you built (20 to 800), https link, track, optional what I learned (600), 3 posts per day. "Featured this week" is a sample-selected strip; who features posts, and how often, is undecided.
6. **Friend versus follow.** Plans say "friends and follows" only. Preview: following is one-way and instant; a friendship needs a request and an accept; following each other does not make friends; unfriending does not unfollow.
7. **Post notifications default.** Preview: off for each newly followed builder until the participant turns them on. Which events notify (posts only, journals, ships) is undecided; the preview gates only simulated Show & Tell posts.
8. **Blocking.** Preview: hides the builder's content everywhere, removes follows, followers, friendship and pending requests both ways, and does not restore them on unblock.
9. **Reporting and review.** Preview: one report per item, with a reason from a short list and optional details (300), stored in the browser; reporting hides the item for you by default. Who reviews reports, response times and penalties are undecided. Plan 22's review-flag process is for peer reviews and was not reused.
10. **Activity list.** Preview shows the 10 latest events from builders you follow, grouped by day. Which events count is undecided.
11. **Page sizes.** Explore 12, Ideas 8, Show & Tell 9, per the task brief and a judgement call for Ideas.
12. **Public projects in Explore.** Only sample projects are shown. The participant's own projects are not included because that data belongs to another module.
13. **Sample content.** Builders come from `lib/sample/builders.ts`. Projects, journals, ideas, posts, comments, activity events and follower counts are invented placeholders with no real person, repository or result. Post links point at `example.org`.

## Shared files this folder relies on

`lib/preview-store.ts`, `lib/notifications.ts` (`pushNotification` for new follower, accepted request, comment on your item, idea status change and simulated posts), `lib/sample/builders.ts`, `components/ui/ui.tsx` and `ui.css`, and the shell classes in `app/globals.css`. `lib/ore-ledger.ts` is not used: no plan grants Ore for community actions in this scope.
