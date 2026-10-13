# Depth darkness: the homepage gets darker the deeper you scroll

Status: implemented on the feature/depth-darkness branch, awaiting owner check.
Binds to: [DESIGN.md](DESIGN.md) and the [design system](../../docs/design/system/design-system.md), sections "Depth markers and rulers" and "Grain and paper".

## Design read

The homepage is a descent: its markers count from −000 M to −900 M and the 404 page sits at −1404 M in near-black rock. The owner noticed the 404 is darker than the homepage and asked for that darkness on the homepage too, growing as you scroll. Reading down the page should feel like going down the shaft: the hero is the lit surface, the footer is the bottom level.

Direction: industrial and signage, as locked in DESIGN.md. Counterfactual test: a plain dark mode, or a gradient wash, could belong to any site. Tying the darkness to the real scroll depth, ending at the 404's black, belongs to this one.

## Scope

- In: one decorative layer on the homepage (`.depth-dark` in `app/page.tsx`) and its stylesheet (`app/depth-dark.css`).
- Out: the 404 and cave-in pages (they have their own darkness), the Docs, the nav, the cards, the grain and the rulers, and any text colour. No JavaScript is added.

## How it works

- A fixed layer sits above the page background and its grid and below the content (z-index 1; content is 2, nav 50, grain 40). It therefore darkens the backdrop only, never text or cards, so the cards stand out more as it deepens.
- Its opacity follows the scroll position through a CSS scroll-driven animation (`animation-timeline: scroll(root)`): 0 at the top, 1 at the bottom, linear in between. There is no scroll listener, no React state and no re-render; only the opacity of one compositor layer changes.
- Dark theme: a radial gradient from a soft black in the middle (`rgba(6, 8, 9, .6)`, which turns the page grey `#222627` into about `#111415`, close to the 404's `#0e1112`) to a darker rim (`rgba(0, 0, 0, .86)`).
- Light theme: the paper keeps its colour (the muted text is already close to the contrast limit on it). Only the rim deepens (`rgba(26, 23, 20, .32)`), as on the 404.

## States

| State | Behaviour |
|---|---|
| Top of the page | Opacity 0: the page looks exactly as before. |
| Middle | About half the shade. |
| Bottom (footer, −1000 M) | Full shade: near-black in the dark theme, a darker rim in the light theme. |
| Scrolling back up | The shade lifts again with the scroll. |
| Dark and light | Each theme has its own shade (above). Switching the theme while scrolled changes the shade at once. |
| Phone | The same layer and gradient; the viewport is smaller. |
| Reduced motion | Kept. It is a colour change tied to the scroll, with nothing moving on the page. |
| A browser without scroll-driven animations | The layer is not shown and the page looks as it did before this change. |
| No JavaScript | Works: it is CSS only. |

## Accessibility

- The layer is `aria-hidden`, ignores the pointer (`pointer-events: none`) and holds no text.
- Contrast only improves in the dark theme: the page text `#E9EBE7` and the muted text `#A7AEAB` sit on a darker backdrop. The light theme's paper is untouched, so its contrast does not change.
- The faint-until-lit depth numerals stay discoverable with the lamp; they are decoration.

## Performance

One fixed element, opacity only (compositor). No layout, no paint of the page on scroll, no JavaScript on the main thread.

## Skills

Loaded earlier in this conversation for UI work: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations`, `svg-design`, `pixel-art-sprites` and `pixel-art-animator`. The motion rules that applied: animate only opacity, no scroll listeners, honour the user's motion setting (here the effect is colour only), and give the effect a purpose (the descent). There is no sprite or vector work in this change.

## Acceptance

1. At the top of the page the layer's opacity is 0; at half the page it is about 0.5; at the bottom it is 1; scrolling back up returns it to 0.
2. The layer is fixed, `aria-hidden`, `pointer-events: none`, and sits above the page and below the content.
3. The dark theme's shade is near black (`rgba(6, 8, 9, …)`) and the light theme's is the soft ink rim (`rgba(26, 23, 20, …)`).
4. The 404 and the Docs have no such layer.
5. The whole browser suite, typecheck, lint and unit tests pass.
