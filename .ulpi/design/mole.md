# Orry the Maulwurf: the ore miner mascot on the homepage

Status: implemented on the feature/mole branch (local), awaiting owner check. The way he reacts to the pointer was rebuilt on 2026-10-15 to the rules in [mole-behaviour.md](mole-behaviour.md); this brief says what it does today.
Binds to: [DESIGN.md](DESIGN.md), the [design system](../../docs/design/system/design-system.md), [custom-cursor.md](custom-cursor.md) (the hand cursors). The mascot is meant to become LOADOUT's main character and later its onboarding guide; only the homepage part is built here.

## Design read

Reading this as: a landing page for teenage builders in a mining theme (Zeche, Revier, "Glück auf"). A mole in a miner's helmet is the obvious inhabitant of the shaft, "Maulwurf" is also the German word, and a small creature with moods is what makes a page feel made by a person. Counterfactual test: a generic floating assistant could sit on any site; a pixel Maulwurf with the LOADOUT helmet, who digs up through the footer and gets grumpy when petted too much, belongs to this one.

The mole is play, not content. It never carries information, never blocks anything, and is easy to hide for good.

## What it does

Orry lives along the bottom of the screen. He turns up soon after the page loads, stays a good while, runs back and forth along the bottom, digs down and comes up somewhere else, and leaves for a short break before the next visit.

| Moment | What happens |
|---|---|
| Turning up | First time 3 to 6 seconds after the page loads, then again 8 to 20 seconds after he leaves. Three ways: it pops out of the ground in a spray of dirt, runs in from the left or right edge, or peeks out of a mound, looks left and right, and either ducks away or pops out. |
| Staying | It idles and blinks, runs along the bottom in short and long dashes (he never walks), sniffs, looks up, looks back at you, yawns, and after a long quiet spell falls asleep (Zs). It wakes with a start when the pointer comes close. It stays 40 to 90 seconds in all. About one time in five when it settles, it digs down and tunnels along under the ground (a trail of soil shows where), then pops up somewhere else on the bottom edge. At the end of the stay it digs down and leaves. |
| What counts | Only a real movement of the pointer counts, so a pointer that sits still never pets him, even when he runs right under it. Gestures are judged on his body box (the middle 70% of the frame, from under the helmet down to the feet), at pointer speeds measured over the last 0.7 seconds. |
| Poke | One quick tap (under 0.25 s): a small hop, a heart, and a smug look. |
| Tickle | Two taps within 0.4 s, or three within a second: he laughs and squirms for 1.5 seconds, then looks excited. A tap during a tickle cannot cut it short. |
| Petting | Slow movement over his head and helmet (not his body), 80 to 700 px a second, in any pattern (circles count). Small hearts and a happy wiggle first. After about 6 more seconds of it he is blissful (big hearts, laughing now and then), and after another 6 overjoyed (a hop). Kept up for a long time he gets tired of it. |
| Scribbling | Fast or jittery movement over his head (over 1,000 px a second, or back and forth) is not petting: it only annoys him. |
| Moods | Two meters, affection and irritation, and a stage in each that cannot change faster than 6 seconds (affection) or 10 seconds (irritation). Irritation goes wary (a glance and a head shake), annoyed (anger mark, he shuffles off), angry (he puffs, then sulks for a few seconds), furious (he stomps and storms off for a minute). If you stop he calms down one stage about every 10 seconds. After a storm-off he is touchier for two minutes. Scribbling takes about 12 seconds to make him annoyed and about 32 to reach furious. |
| Pinch | Press and hold still for half a second: ow, then the cheek stretches and squishes while you hold on. When you let go he rubs his cheek, or swats at you if he is angry, or stomps off if he is furious. |
| Picked up | Press and drag more than 8 px (12 on touch). He yelps ("!") and hangs from the scruff, amused with sparkles for about 6 seconds, then confused for 2, struggling for 5, angry for 6, tired for 6, then limp. If he is already fed up the amused part is shorter or skipped. The cursor is the fist. |
| Shaken | Moving him side to side fast while holding him: light, strong, then violent, counted over the last 1.2 seconds. A strong shake for 1.5 seconds makes him queasy, a violent one for 3 seconds makes him dizzy. The cursor is the shaking fist. |
| Dropped or thrown | He falls, and a fast release throws him: he flies, bounces off the floor (up to three times) and the walls, and lands in a squash. After a gentle carry he hops for joy. After a violent shake, or if he is angry, he puffs and shakes his head, then sulks. After a big fall or a violent shake he is dazed for about 6 seconds: he sways with stars, shakes his head, rubs the bump, looks confused, wobbles and gets up. |
| Sequences play out | A reaction that has started plays to its end. A tap, a stare or a mood change during one waits or is dropped. Only being picked up (or the footer button) interrupts him. |
| Pointer near | He looks at the pointer in eight directions, keeps looking for at least 4 seconds and until 6 seconds after it last moved, and only turns his head once the pointer has been in a new direction for 0.6 seconds. He stays put while a pointer is moving on him. A pointer that sits still near him for 5 seconds makes him suspicious. If the pointer is low on the screen he sometimes runs over and sniffs it, and when he is happy he follows it along the bottom. A pointer charging at him fast makes him run for a moment and stick his tongue out. |
| Hiding it | The footer button "Hide Orry" sends it away for good (kept in this browser). It becomes "Bring Orry back". |

URL options, for the owner and for tests: `?mole=1` shows him after a second (any kind of arrival), `?mole=pop` always pops him out of the ground, `?mole=0` keeps him away, and `&speed=8` runs his moods and the long hold 8 times faster.

## States for people and devices

| Case | Behaviour |
|---|---|
| Reduced motion | It never turns up by itself and never runs. The footer button reads "Call Orry" and brings it out standing still (one frame, no cycling); it can still be poked, petted and picked up, and dropping it is instant. |
| Touch screen | It is half the size (1x, 64 px), a tap pokes him and a finger drag picks him up (a long press pinches him; there is no petting by dragging a finger). `touch-action: none` applies to the mole only. |
| Keyboard and screen reader | The mole is decoration and is hidden from assistive technology. Everything it does can also be done, or switched off, with the footer button, which is a normal button. Nothing about the page depends on the mole. |
| Tab in the background | It stops while the tab is hidden. |
| Light and dark | The mole is the same in both themes (it is not recoloured). |
| Docs, 404 | No mole. |

## Layout

- A fixed layer over the page, above the Docs tab and below the nav and the film grain. The layer lets every pointer event through; only the mole's own 64 px box takes the pointer.
- The mole stands on the bottom edge of the viewport, feet on row 60 of its frame. Size: 2x on screens 640 px wide and up (128 px), 1x below.
- Cursor: the open hand over it, the fist while it is held (the same Kenney hands as the Docs tab). While you stroke it the cursor is a flat petting hand, with a small pink heart once it is in bliss; while you press on it without moving it is a pinching hand (Kenney tiles 0175 and 0178, recoloured the same way). While you shake it the cursor is a shaking fist, when it is furious (stomping, or petted far too much) it is a stop hand, and right after its jump for joy it is a thumbs up (our own drawings, same two colours).

## Art

- Drawn by an image model (GPT) from the prompts in `assets/editable/mole/PROMPTS.md`, then cleaned: the magenta background keyed out, each sprite found as its own shape, shrunk to 64 px with a box filter, anchored to the ground line, and locked to one 22-colour palette. The mole uses 184 frames in twelve sheets (moving, expressions, dig and peek, picked up, petted, reactions, walk and run cycles, idle and jump, a second walk, looking around with more moods, falling, landing, jumping for joy and being pinched, and being dazed and getting back up); the effects (hearts, sweat, anger mark, Zs, stars, dust, dirt) use 19 frames at 32 px.
- Two atlases: `public/loadout/mole/mole.png` (640 by 1280, about 155 KB) and `fx.png` (256 by 96, 2.6 KB). `assets/editable/mole/build-atlas.cjs` rebuilds them from the cleaned frames and `slice-sheets.cjs` makes the frames from the sheets.
- Run is 6 frames at 12 fps (his only way of getting about), idle 6 at 4. Falling is a 4-frame tumble, landing is one squash straight into what comes next, the jump for joy is crouch, launch, a kick each way, and a soft landing, and a pinch goes ow, stretched cheek, squished face, with a cheek rub when you let go. The new walk and idle frames are close to the old ones (the model keeps the body steady and moves the limbs only a little), so the engine adds a one pixel hop on each step. A hand-drawn touch-up of the walk is recommended.

## How it works

- `engine.ts`: one state machine and one animation frame loop, which runs only while the mole is on screen. It writes a transform and a background position; React never re-renders for the mole.
- `Mole.tsx` hosts the elements, `MoleToggle.tsx` is the footer button, `frames.ts` names the animations, `mole.css` positions and scales it. The toggle and the engine talk through two window events, so neither imports the other's state.
- Effects are small elements animated with the Web Animations API and removed when done.

## Accessibility

- No flashing, nothing that moves faster than his normal run except falling, running away from a fast pointer and the storm-off, and none of it carries meaning.
- Reduced motion removes all autonomous motion (see above).
- The toggle is a text button with a visible focus ring and a clear label.
- Contrast is not affected: the mole never sits over text for long, and it can be moved or hidden.

## Skills

All seven UI skills were loaded for this branch of work: `frontend-design-ui-ux` (this brief), `frontend-design`, `design-taste-frontend`, `emilkowal-animations` (transform only, reduced motion, nothing decorative that nobody asked for), `svg-design`, `pixel-art-sprites` (palette, anchor, integer scale, hard edges) and `pixel-art-animator` (frame lists, per-animation timing, loops and one-shots).

## Acceptance

1. With `?mole=pop` the mole pops out of the ground at the bottom of the screen and settles.
2. The layer is hidden from assistive technology and lets the pointer through everywhere but on the mole.
3. A tap pets it. Stroking leads to annoyed, stomping and storming off. Picking it up makes it dangle, then struggle; dropping it makes it fall and land.
4. The footer button hides it for good and brings it back; `?mole=0` keeps it away.
5. With reduced motion it never turns up by itself, the button calls it, and it stays still.
6. On a phone it is 64 px.
7. The whole browser suite, typecheck, lint and unit tests pass.
