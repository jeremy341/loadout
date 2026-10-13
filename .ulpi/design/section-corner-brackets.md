# Section corner brackets

Status: implemented on this branch.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), section "Corner brackets".

## Design read

The field manual's registration marks: a heading is framed the way a drawing frames a title block. The marks belong to the existing hero frame and hero buttons, so they read as one family.

## Scope

- In: the section headings (`.home .sect > .h2`), eleven on the homepage.
- Out: cards, nested panels and every button. The anti-slop bans rule out decoration on every surface. There is no dedicated final call-to-action section, so none is framed.

## Rules

- Four marks, 16 by 2 pixels, in `--fg` (ink in light mode), drawn with gradients on `::before`.
- The heading box is `fit-content`, so the marks hug the text. The marks sit outside the box (`inset: -14px -18px`) and do not change the layout.
- Static only. The pointer-following version stays on the hero buttons.

## Acceptance

1. Every section heading shows the four marks in both themes.
2. Cards show no marks.
3. Heading positions and sizes do not change.
