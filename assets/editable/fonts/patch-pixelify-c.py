"""Opens the letter C in Pixelify Sans (see .ulpi/design/pixel-font-open-c.md).

In the stock font the capital C differs from the O only by a one-pixel notch on its right side, and in the bold
weights that notch shrinks to a hairline, so "ROCK" reads "ROOK". This script widens the opening of C and c at both
masters of the weight axis (400 and 700). Nothing else changes: advance widths, outer bounds, every other glyph and
the font's names stay as they were. The accented forms (Ccedilla, Ccaron, ...) reuse C and c and follow.

Usage (needs fontTools: pip install fonttools):
    python assets/editable/fonts/patch-pixelify-c.py            writes apps/landing/public/fonts/PixelifySans.ttf
    python assets/editable/fonts/patch-pixelify-c.py --check    exits 1 if the committed font differs from the result

Pixelify Sans is licensed under the SIL Open Font License 1.1 with no reserved font name, so a modified copy may be
shared under the same licence (apps/landing/public/fonts/PixelifySans-OFL.txt).
"""

import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "PixelifySans.original.ttf"
TARGET = HERE.parents[2] / "apps" / "landing" / "public" / "fonts" / "PixelifySans.ttf"

# Per glyph: the point indices of the two edges of the notch, and the new y of each edge at the 400 and 700 masters.
# The y values sit on the font's pixel rows (about 92 units each).
#   C: three pixel rows open (rows 3 to 5 of 7), one pixel row of stub left at the top and the bottom.
#   c: one pixel row open (row 3 of 5) at both weights; stock c collapses to a 35 unit slit at 700.
EDITS = {
    "C": {"top_edge": ([9, 10], 448, 452), "bottom_edge": ([15, 16], 172, 175)},
    "c": {"top_edge": ([9, 10], 265, 276), "bottom_edge": ([15, 16], 173, 180)},
}


def build() -> TTFont:
    # recalcTimestamp=False keeps the output reproducible: saving does not stamp the current time.
    font = TTFont(SOURCE, recalcTimestamp=False)
    bold = instancer.instantiateVariableFont(TTFont(SOURCE, recalcTimestamp=False), {"wght": 700})
    glyf, gvar, hmtx = font["glyf"], font["gvar"], font["hmtx"]
    for name, edges in EDITS.items():
        glyph = glyf[name]
        default = glyph.coordinates
        heavy = bold["glyf"][name].coordinates
        count = len(default)
        (variation,) = gvar.variations[name]
        # Make every point's delta explicit (the stock font leaves some to be inferred), then move the notch edges.
        deltas = [(round(heavy[i][0] - default[i][0]), round(heavy[i][1] - default[i][1])) for i in range(count)]
        deltas += list(variation.coordinates[count:])  # the four phantom points keep their stock values
        for points, y_default, y_heavy in edges.values():
            for index in points:
                default[index] = (default[index][0], y_default)
                deltas[index] = (deltas[index][0], y_heavy - y_default)
        variation.coordinates = deltas
        glyph.recalcBounds(glyf)
    # The advance widths must not move, or text would reflow.
    original = TTFont(SOURCE, recalcTimestamp=False)["hmtx"]
    for name in EDITS:
        assert hmtx[name] == original[name], f"advance width of {name} changed"
    return font


def main() -> int:
    check = "--check" in sys.argv
    out = HERE / "_patched.tmp.ttf" if check else TARGET
    build().save(out)
    if check:
        same = out.read_bytes() == TARGET.read_bytes()
        out.unlink()
        print("committed font matches the script" if same else "committed font differs from the script")
        return 0 if same else 1
    print(f"wrote {TARGET}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
