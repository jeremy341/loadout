# ASCII Koi (vendored for the platform backdrop and sidebar)

`pond.js` is the koi pond engine from https://github.com/pursurer/ascii-koi (MIT License, see `LICENSE`), as vendored in the
Nishiki project (`dim()` may return several clearings, `opts.count` fixes the number of koi).

Changes made here:
- The monospace font is "JetBrains Mono", the face the site already loads for ASCII art.
- `opts.clear`: the canvas is cleared instead of painted with water colour, so the koi swim over the page.
- `palette().koi`: four marking colours, one per colour scheme, so the fish can wear the site colours.
- `opts.bare`: only the koi, their wakes and ripples are drawn, no open-water dots or caustics.

The engine is decorative only. The component that uses it (`app/_components/platform/KoiPond.tsx`) hides it when the visitor
turns on "Hide ASCII drawings", and stops it moving for reduced motion.
