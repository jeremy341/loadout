# Redesign phase 2: the project creation wizard

Binds to `.ulpi/design/DESIGN.md` and `docs/design/system/design-system.md`. Plan: `plans/proposals/participant-redesign-plan.md` section 3.3 (kind cards, sparks and the step flow are owner approved, decisions rows 14 and 15), section 7 phase 2, section 8 tests. Shell it lives in: `.ulpi/design/redesign-phase-1-shell.md`. Written 16 Nov 2026, before code.

**Design read.** A product flow for teenage builders starting their first project. It must feel light (one question per screen) and keep out projects that are not technical. LOADOUT's own look stays: graphite and stone, Pixelify headings, IBM Plex Mono body, DotGothic16 step labels, square corners, 1px outlines, hard offset shadow, no blur, no glow, the track colours. The reference (five numbered steps, step header on top, a bar with Back and Next at the bottom, a live card on the name and review steps) gives the structure only. Its serif look is not copied. Dials: variance 3, motion 2, density 3.

Skills loaded for this change: frontend-design-ui-ux, frontend-design, design-taste-frontend, emilkowal-animations, svg-design, pixel-art-sprites, pixel-art-animator. The last three apply to no asset here (the two kind cards use no new icon, only the track swatch; no sprite is made or edited).

## Flow

A page, `/dashboard/projects/new`, inside the phase 1 shell (sidebar stays; Projects is the current section). The header "New project" button, the grid's dashed tile and the empty state button are links to it. The old dialog is deleted.

```
Close                                              NEW PROJECT
[01 kind][02 idea][03 name][04 links][05 review]      step header

WHAT KIND OF PROJECT IS IT?                           heading (focus lands here)
...one question...

[ Back ]                                       [ Next ]   bottom bar
```

| Step | Heading | Content | Next is enabled when |
|---|---|---|---|
| 1 kind | What kind of project is it? | Two cards, Software and Hardware. Software reveals Tools, Systems and Compute. Hardware is the Hardware track at once. | a track is set |
| 2 idea | What's your idea? | Textarea, 0 / 500, "Need a spark?" with three sparks and More ideas | 10 to 500 characters after trim |
| 3 name | What's it called? | Title input, 0 / 80, live preview card, public notice | title not empty after trim |
| 4 links | Link it up | Source and demo address (optional), Hackatime block | always (button reads Skip when both are empty) |
| 5 review | Ready to start? | Preview card, facts with Change buttons, track note, Create project | always |

Kind is not stored. It is derived from the track (`Hardware` is hardware, the other three are software). No "Decide later". Old projects with no track still open and edit as before.

## Copy (owner approved, plan 3.3)

- Software card: "Tools, systems and compute: command line tools, servers, databases, machine learning." Hardware card: "Circuits, boards, robots: anything you can hold in your hand."
- Track row legend: "Which track? You can change it until you submit." Track text comes from `TRACK_BUILDS` (one source).
- Idea sub copy: "It does not have to be big, clever or finished. Just something you would enjoy building. A sentence or two is plenty." Helper under 40 characters: "Add a bit more before you ship: 40 characters is the minimum." (never blocks).
- Name sub copy: "A working title is fine. You can rename it any time." Notice: "Every project is public, including drafts and journals. Do not put personal details in them."
- Links sub copy: "This step is optional. Skip it and add any of it from the project page later." Hackatime (software): "Hackatime is not connected yet. Connect your Hack Club account in Settings and your projects will list here with their coding time." with a disabled Connect Hackatime button. Hardware: "Hardware projects use a Lapse recording. You will link it in your journal entry." No project list, no hours.
- Review note: "You can change the track until you submit." Success line on the project page: "Project created. It is public. Write your first journal entry when you start work."
- Leave confirm (only if something was typed): "Leave without creating? Nothing is saved." Stay and Leave.
- Sparks: twelve for software, twelve for hardware, the plan 3.3a lines word for word, each 90 characters or fewer.

## Components

- Step header: an ordered list of five buttons, `aria-current="step"` on the current one. Done steps are enabled, later steps are disabled until every step before them is valid. Segment fills use `--pf-ac` for done and current; the current label is also underlined, so colour is never the only sign. Labels: DotGothic16 12px uppercase. Phone: only the current label shows, the segments stay.
- Kind cards: native radios (name `kind`) inside labels, the same card as the old track choices (1px outline, panel fill, `Selected` tag, link-colour border when checked). Track cards: native radios (name `track`) with the track swatch.
- Spark buttons: dashed outline, full width, left aligned. Click fills the textarea. If it already had text, the spark replaces it and an Undo button shows for five seconds. More ideas rotates to the next three; no spark repeats until the pool is used (pure `sparkPage` in `lib/platform/sparks.ts`).
- Preview card: the project card markup (cover with status, track and depth chip, title, two lines of description) as a non-link block, so what they see is what the grid shows. Empty title reads "untitled". On a fine pointer without reduced motion it tilts at most 2 degrees toward the pointer.
- Bottom bar: Back (plain) left, Next or Create project (primary) right. Phone: sticky at the bottom, full width buttons, 48px.
- Close: a link top left to Projects. If anything was typed it opens the PfModal confirm instead.

## States

| Surface | Default | Error | Loading |
|---|---|---|---|
| Step 1 | nothing chosen, Next disabled | none (the cards cannot be invalid) | none |
| Step 2 | empty textarea, 0 / 500 | on Next or Enter under 10 characters: "Write at least 10 characters." | none |
| Step 3 | empty title, preview says untitled | on Next or Enter: "Give the project a name." | none |
| Step 4 | empty fields, Hackatime not connected | on blur, Next or Enter: the checkLinkUrl message under the field | none |
| Step 5 | review | server error in a block above the bar; the wizard jumps to the step of the field it names | button says Creating and is disabled |

Errors are in a `p` with `id`, linked by `aria-describedby` and `aria-invalid`, inside a polite live region that is always mounted. Draft values live in one reducer and in `sessionStorage` under `loadout-new-project` (read after mount, every access in try and catch), cleared after a project is created or after Leave.

## Keyboard and focus

- Enter in a text input or the textarea moves to the next step only when the step is valid; otherwise it shows the error and stays. Shift+Enter in the textarea is a new line. Enter on a button does that button's job. Enter never submits a half-filled form.
- Focus moves to the step heading (`tabindex="-1"`) on each step change (not on first load). Arrow keys move inside a radio group; Tab leaves it. Software then its track row: Tab from the Software card goes into the three tracks.
- Escape does nothing on its own (too easy to lose work). Close is the exit.
- Targets are 44px or more (48px for the bar). Visible `:focus-visible` outline in `--pf-focus` everywhere.

## Motion

Step change: heading and content fade in and rise 8px over 220ms with `--pf-ease`, only under `prefers-reduced-motion: no-preference` and not when motion is paused in the site settings. Otherwise the step swaps instantly. Nothing is required to be animated. The preview tilt is the same gate and also needs a fine pointer.

## Themes and breakpoints

Only `--pf-*` tokens and the existing `data-track` colours; no new colour. Both themes are checked with axe on each step. Widths 1440 and 390 get screenshots; no horizontal scroll at 320, 390, 471, 700, 900, 1440. Forced colours: borders use `CanvasText`.

## Server

`createProject` takes `title`, `description`, `track`, `repoUrl`, `demoUrl`. `checkProjectInput` is the one validator: track required (one of the four, no empty), description 10 to 500, title 1 to 80, both addresses optional and run through `checkLinkUrl` (https only, public host). Edits keep their looser rules so old projects with no track or a short description can still be changed (`checkProjectInput(raw, "edit")`). No database change: kind is derived and the links use the existing `repoUrl` and `demoUrl` columns.

## Acceptance

1. `/dashboard/projects/new` shows the five steps; the New project button and tile open it; no dialog remains.
2. Software reveals Tools, Systems, Compute; Hardware needs no second choice; there is no Decide later.
3. A spark click fills the idea box; More ideas rotates without repeats inside a cycle.
4. The preview card follows the title, description and track.
5. The Hackatime block says it is not connected and shows no list.
6. Review shows the track and says it can change until submit. Create lands on the new project page, which shows the draft and the one time line.
7. A keyboard alone can finish all five steps. Focus lands on the step heading each time. Errors are announced.
8. axe finds no WCAG 2.2 AA violation on any step in either theme; no horizontal scroll at the six widths.

Hand off to: the Next.js engineering agent. Implement exactly this. Do not redesign.
