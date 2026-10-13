# Font sources

- `PixelifySans.original.ttf`: the stock Pixelify Sans variable font (weights 400 to 700), unmodified. Licence: [`PixelifySans-OFL.txt`](../../../apps/landing/public/fonts/PixelifySans-OFL.txt), next to the font the site serves (SIL Open Font License 1.1, no reserved font name).
- `patch-pixelify-c.py`: widens the opening of the capital C and the lowercase c, at both ends of the weight axis. Nothing else in the font changes, and the advance widths stay identical. Brief: [`.ulpi/design/pixel-font-open-c.md`](../../../.ulpi/design/pixel-font-open-c.md).

The patched font is `apps/landing/public/fonts/PixelifySans.ttf`. To rebuild it, install fontTools (`pip install fonttools`) and run `python assets/editable/fonts/patch-pixelify-c.py`. `--check` exits 1 if the committed font is not what the script produces.

Pixelify Sans: Copyright 2021 The Pixelify Sans Project Authors (https://github.com/eifetx/Pixelify-Sans). The modified copy is shared under the same licence.
