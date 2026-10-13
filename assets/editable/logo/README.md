# LOADOUT logo sources

- `mark-helmet-dark.svg`, `mark-helmet-light.svg`: the miner's helmet mark on its octagon plate, 24 by 24 pixels, one `rect` per pixel run. The helmet is from the one-bit icon pack (the owner confirmed it can be used). The site draws the same mark from `apps/landing/app/_components/home/Logo.tsx`.
- `wordmark-dark.svg`, `wordmark-light.svg`: the custom pixel wordmark, 7 by 9 pixel letters. The site's nav and footer use the real text in Jersey 10 instead; the wordmark is for the share image and for places that need a drawn logo.
- The share image is `apps/landing/app/opengraph-image.jpg` (also used as `twitter-image.jpg`): 1200 by 630, the mark, the wordmark, the tag line, the engineering-paper grid, grain under the text, corner brackets and the depth strip. It is a JPEG under 300 KB so that apps with small preview limits still show it.
