# Mole sprite sheets: the prompts

The mole art was made with an image model (GPT) in October 2026. This file keeps the prompts, so the characters can be regenerated or extended in the same style and so the origin of the art is on record. Paste the style block first, attach the reference image to every later prompt, and generate one sheet per message. The sheets come back as JPEGs, so the slicer (`slice-sheets.cjs`) keys out the magenta, finds each sprite and shrinks it; the model cannot draw an exact 32 or 64 pixel grid itself.

## Style block

```
You are a pixel-art sprite artist. Draw a mascot: a chunky, round European mole (Maulwurf) in strict pixel-art style, side or front view as asked.
Design: dark blue-grey fur, pointed pink snout, tiny dot eyes (1-2 pixels), big pale spade-shaped hands with claws, short stubby legs, tiny tail, and a small yellow miner's helmet with a tiny lamp on the front. Cute but not cartoonish-realistic; a bit grumpy-lovable.
Rules, all strict:
- Every sprite is a 32x32 pixel sprite, drawn magnified exactly 8x. So each sprite cell is 256x256 pixels and is made of crisp 8x8 pixel blocks. Every block is a single flat colour.
- One pixel (8x8 block) dark outline. No anti-aliasing, no gradients, no dithering, no soft shading, no glow, no drop shadow, no blur.
- Use ONLY these 13 colours: #0E1215 outline, #3A3F47 #5A616B #8B939E fur, #E59A9A snout, #F2C4B0 hands, #F7EFE0 claws, #C4556A mouth, #FDCF03 #C79A00 #FFF3A8 helmet and lamp, #FFFFFF eye shine (one pixel only).
- Flat background of exactly #FF00FF (magenta) in every cell. No text, no labels, no borders, no watermark.
- The mole is about 24 pixels wide and 20 pixels tall inside its 32x32 cell, centred horizontally, feet resting on pixel row 29 from the top. Keep this size and position identical in every cell.
- The same character in every cell: same proportions, same helmet, same colours.
```

What came back: the model drew at about 64 pixel detail (not 32), and did not keep to the 13 colours exactly. The frames are therefore kept at 64 px and the palette is the one measured from the sheets.

## Sheets

Each message is the style block, "Use the attached reference mole exactly.", and one of these tasks. Sheets are 4 columns by 4 rows of 256 pixel cells (1024 by 1024) unless said.

- **A, moving** (side view facing right). Row 1: idle, 4 frames (a slow breathing bob; frame 3 is a blink). Row 2: walk, 4 frames (a waddle, hands swinging). Row 3: scurry, 4 frames (fast, leaning forward). Row 4: sniffing with the snout up, looking up, yawning, looking back over the shoulder.
- **B, expressions** (front view, standing). Left to right, top to bottom: neutral, happy (eyes as ^ ^), very happy (open mouth), blissful (eyes closed, blush), surprised, confused, sleepy, sleeping, annoyed, angry, furious, sad, sulking, embarrassed, smug, determined. Express with eyes, brows, mouth and posture only; no hearts or symbols.
- **C, dig and peek** (side view, ground on row 29). Row 1: digging, 4 frames. Row 2: sinking into the ground, 4 frames, a soil mound forming. Row 3: popping out of the ground, 4 frames. Row 4: peeking from a mound: head up, looking left, looking right, ducking.
- **D, picked up** (front view, lifted by the scruff, grab point top centre). Just grabbed; dangling swinging left, centre, right; struggling, 4 frames; tired and panting; gives up (limp); falling; landing squashed; dizzy (spiral eyes); shaking it off; standing back up; neutral.
- **E, petted** (front view). Leaning up into a hand; happy wiggle, 4 frames; blissful, 2 frames; annoyed, 2 frames; shaking its head no; angry puff; stomping, 2 frames; turning its back; storming off, 2 frames (side view facing right).
- **F, effects** (16 by 16 pixel sprites magnified 8x, so 128 pixel cells; 8 columns by 4 rows; the model drew them larger, so they are used at 32 px). Row 1: small heart, big heart, sweat drop, anger mark, "Z", "!", "?", sparkle. Row 2: two dizzy stars, three dust puffs, three dirt chunks. Row 3: three dirt mounds of growing size.

- **G, reactions** (front view, made after the first five sheets by attaching the earlier sheets as the reference so the mole stays the same). Cells 1 to 4 laughing, 5 and 6 "ow" (cheek squished), 7 and 8 looking left and right, 9 looking up, 10 eyes closed, 11 crouching, 12 jumping with arms up, 13 to 15 swatting at the viewer, 16 queasy. The model drew four laughing frames and an eyes-closed frame instead of the landing frame the prompt asked for, so cell 10 and cell 11 are used as they came: the engine uses the crouch for landing.

- **H, cycles** (side view facing right, made with the earlier sheets attached as the reference). Cells 1 to 8 a walk cycle, 9 to 14 a run cycle with dust, 15 and 16 turning (not used: cell 15 is still side-on and cell 16 front-on). The prompt asked the model to keep the body, helmet and snout fixed and move only the limbs, which kept the mole steady but made the walk subtle.
- **I, more** (made the same way). Cells 1 to 6 idle (breath, snout twitch, blink, lamp flicker), 7 and 8 falling, 9 to 12 a jump for joy, 13 and 14 landing, 15 and 16 dig in-betweens (not used).

- **J, walk retry** (8 cells). The same walk as H with the movement exaggerated (body rocks, feet lift 3 pixels, hands swing, tail flicks). This is the walk the game uses.

- **K, gaze and moods** (front view). Cells 1 to 8 look in eight directions (left, up-left, up, up-right, right, down-right, down, down-left), 9 to 16 moods: excited, proud, worried, suspicious, touched, mischievous, bored, cheeky. Cells 11 (worried) and 13 (touched) did not come out well and are not used.

- **L, falls** (front view). Cells 1 to 4 falling and tumbling, 5 to 8 landing (squash, bounce, squash, dazed with stars), 9 to 12 a jump for joy, 13 to 16 being pinched (ow, cheek stretched, squished face, rubbing the cheek). The model drew speed lines and stars as loose marks, so this sheet is sliced by grid cell (`byCell`) and one stray line on the sheet is erased.

- **M, dazed** (front view, sitting). Cells 1 to 4 sway with stars going round, 5 and 6 shake the head, 7 and 8 rub the bump, 9 and 10 look about confused with a question mark, 11 and 12 wobble, 13 to 16 get back up. Sliced by grid cell because the stars and motion marks float.

## Reference

Generate a reference sheet first (the mole facing the camera, in side view facing right and from the back, in a row of three cells) and pick the best one; every later sheet depends on it.
