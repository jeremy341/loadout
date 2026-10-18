# Orry's behaviour, redone: interactions, moods, sequences, movement and effects

Status: the gesture classifier (`gestures.ts`), the mood meters (`mood.ts`), the tuning table (`tuning.ts`) and the state machine are built to this plan (2026-10-15), with unit tests for every rule in sections 2 and 3. Still to build: the page events (theme switch, Docs open, coming back to the tab), the first-notice wave, the happy-follow distance rules in full, and the per-frame timing of the sequences. Replaces the pacing, the petting count and the effect triggers in [mole.md](mole.md); the art, the cursors and the page layout there stay.

Why: in play Orry gets angry far too fast (a normal rub reaches stomping in about 4 seconds), moods change with no warning and no minimum time, a jittery mouse counts as petting, effects fire without rules, every animation plays at one speed, and there are only a few things you can do to him. This version adds more things to do, gives each reaction a proper shape (anticipation, action, reaction, settle), and fixes the order of things: decide what the person did, update his mood, pick what he does, then pick the effects.

Skills applied: pixel-art-animator (frame timing, holds, anticipation and follow-through, variable timing), emilkowal-animations (ease-out defaults, short durations, immediate feedback, interruptible motion, asymmetric press and release, frequency before decoration, reduced motion keeps something gentle, pointer capture, one touch only), game-ui-ux (events not polling, a priority stack, always something that works with the keyboard). Design brief: this file; the cursor and art rules stay in the existing briefs.

## 1. The model in one picture

```
pointer, page and time events ─> gesture classifier ─> mood meters ─> stage ─> state machine ─> beats (animation, movement, effects, cursor)
```

Each step only talks to the next. The classifier knows nothing about moods, the meters know nothing about sprites. Every number lives in one `TUNING` table, so pacing is changed in one place and unit tests run on a fake clock. Mood changes are **events** (`stage-changed`, `gesture`), not values read every frame: the cursor, the effects and the animation each subscribe.

## 2. The ways to interact (and what counts)

The hit area is his body box, not the whole 64 px frame: the middle 70% of the width, from the helmet top to the feet. Speeds are screen pixels per second smoothed over 120 ms, so one jittery sample decides nothing. First, the full list, then the exact rules.

| # | Interaction | What you do | How it feels |
|---|---|---|---|
| 1 | **Notice** | Move the pointer near him | He looks at you (8 directions) and keeps looking for a good while: at least 4 seconds, and until 6 seconds after the pointer last moved, then he looks away slowly. The first time in a visit he also gives a small wave so people learn he is alive. |
| 2 | **Poke** | One quick tap | A small surprised hop and a tiny heart. |
| 3 | **Tickle** | Two taps within 0.4 s, or three within 1 s | He laughs and squirms for 1.5 seconds. This is the playful one and it feeds affection. |
| 4 | **Pet** | Move slowly over his head and helmet, in any pattern (back and forth, circles). The body does not count. | Hearts, bliss, then (much later) "that's enough". |
| 5 | **Scribble** | Fast or jittery movement inside him | Annoying, not petting. He backs off and complains. |
| 6 | **Pinch** | Press and hold still on him | Ow, cheek stretch, then he tells you off. |
| 7 | **Pick up** | Press and drag | He dangles, amused at first. |
| 8 | **Swing** | Move him side to side while held | He swings with the pointer and giggles, until it is too much. |
| 9 | **Shake** | Reverse direction fast while held | Queasy, then dizzy. |
| 10 | **Drop** | Let go | A fall that depends on height, then a landing and a reaction that depends on how you treated him. |
| 11 | **Throw** | Let go while moving fast | He flies in an arc, bounces off the floor and walls, and ends up dazed or delighted. |
| 12 | **Play** | Move the pointer steadily along the bottom of the screen, away from him | He runs after it, and when it stops he stops, looks up and gets excited. A cat-toy mode. |
| 13 | **Charge** | Move fast straight at him | He runs for a moment and sticks his tongue out, and nothing is held against you. |
| 14 | **Stare** | Hold the pointer still near him for 5 seconds | He gets suspicious, then bored, then looks away. |
| 15 | **Click near him** | Click the page beside him | He looks at the spot, and if it is a link he looks at you again with raised brows. |
| 16 | **Switch theme** | Use the theme toggle | He squints in surprise at the light, or blinks at the dark. |
| 17 | **Open the Docs** | Pull or click the Docs tab | He digs down so nothing covers the Docs, and comes back when they close. |
| 18 | **Come back** | The tab was hidden for a minute or more | He waves hello, excited, then carries on. |
| 19 | **Footer button** | Hide, bring back or call Orry | The one way to do all of it from the keyboard. |

### The exact rules

| Gesture | It counts when | It does not count when |
|---|---|---|
| **Notice** | The pointer is within 520 px sideways and 480 px up or down (mouse only). His head only changes direction once the pointer has been in the new direction for 0.6 s, so a shaky hand does not make him flick about. | The pointer sits on him (that is petting or poking). |
| **Poke** | Button down and up within 250 ms, moved less than 6 px. | A longer press (that is a pinch). |
| **Tickle** | Two pokes within 0.4 s, or three within 1 s. | A fourth poke within 1.5 s (that is poke spam, see section 3). |
| **Pet** | Inside the hit area, no button, speed between 80 and 700 px/s, for 0.35 s or more with 60 px of travel. Direction changes do not matter, so circles count. | Standing still, crossing him once, or any pattern that goes over the speed band. |
| **Scribble** | Inside the hit area and above 1,000 px/s, or a path more than 5 times longer than the distance covered in 0.3 s at over 600 px/s. | A slow, steady pass. |
| **Pinch** | Button down in the hit area, moved less than 6 px, for 0.5 s or more. | A press that moves more than 6 px (a pick-up). |
| **Pick up** | Button down, then more than 8 px of movement (12 px on touch). | |
| **Swing** | Held, moving horizontally at 150 to 500 px/s. | Faster than that (shake). |
| **Shake** | Held, direction changes faster than every 0.4 s at over 500 px/s, counted in a sliding 1.2 s window: light is 3, strong 6, violent 9. | Slow carrying. |
| **Throw** | Released while moving faster than 900 px/s. The release speed and angle become his launch. | A slow drop. |
| **Play** | The pointer is in the bottom 35% of the viewport, moving 200 to 900 px/s for 0.6 s, not pointing at him. | Fast moves at him (a charge). |
| **Charge** | Above 1,600 px/s, ending within 260 px of him but outside the hit area. | Fast movement inside the hit area (a scribble). |
| **Stare** | The pointer is within 300 px and moves less than 40 px/s for 5 seconds. | |
| **Click near him** | A click or tap within 400 px of him, not on him. | A click on him. |

Touch has no hover, notice, stare, play or charge. A drag always picks him up, a long press is a pinch, a quick tap is a poke, and there is no petting by dragging a finger. Only the first finger counts while he is held (a second finger is ignored).

## 3. How he feels (two meters, a long memory, and habituation)

Two meters from 0 to 100, both visible in a `?mole=debug` overlay while tuning.

**Affection** goes up when he is treated kindly and falls when you stop.

| Source | Change |
|---|---|
| Pet | +8 a second while it lasts |
| Poke | +5 (at most one every 0.4 s) |
| Tickle | +12 |
| Play | +4 a second |
| Jump for joy (gentle carry then drop) | +10 |
| Nothing happening | −3 a second after 1 second |

Stages, each held at least **6 seconds** before the next: **none** (below 5), **happy** (5 to 25: wiggle, small hearts), **bliss** (25 to 70: blissful, laughing, big hearts), **overjoyed** (above 70: one hop, then pride, then back to bliss).

**Irritation** goes up when he is pestered and falls slowly.

| Source | Change |
|---|---|
| Scribble | +12 a second |
| Pet after affection has been at 70 or more for 10 seconds ("that's enough now") | +5 a second |
| Pinch | +14 when it starts, +6 a second after that |
| Poke spam (a fourth poke within 1.5 s) | +8 each |
| Strong shake | +4 a second |
| Violent shake | +8 a second |
| Held past the amused phase | +2 a second struggling, +4 a second angry |
| Dropped after a violent shake | +15 |
| Pet, poke, tickle or play | −2 a second (it soothes him) |
| Nothing happening | −2 a second |

Stages, each held at least **10 seconds**, and the stage only goes **up** while a source has been active in the last 1.5 seconds: **calm** (below 20), **wary** (20 to 40: he glances at you and shakes his head once), **annoyed** (40 to 60: anger marks, he turns away and shuffles off), **angry** (60 to 80: puffs, shakes his head, stop cursor, an exclamation mark), **furious** (80 and up: stomps for 1.2 seconds, then storms off). In the first 10 seconds of a petting session he never goes past wary unless you scribble, so a short rub can never make him angry.

If every source stops for 3 seconds he **calms down one stage every 10 seconds**, with the bored frame as a small sigh, so someone who backs off is forgiven.

**Grudge** is the only long memory. A storm-off sets a flag for 2 minutes: irritation gains are 1.5 times as big and he skips the amused phase when picked up. It clears on its own. This replaces the old multiplier that made everything escalate after one bad moment.

**Habituation (so it never feels like a loop).** The third time in 30 seconds that the same reaction plays, it plays at 60% of its length; the fifth, at 30% and with a different variant when there is one. Variants are drawn from a shuffled bag, so the same one never plays twice in a row.

### What this means in time (the targets)

| What you do | How he reacts |
|---|---|
| Gentle petting, non-stop | Hearts at about 1 second, bliss at about 8. Kept up he reaches "enough" at about 40 seconds, wary at 50, annoyed at 70, angry at 90 and furious at about 110: **close to 2 minutes** before he storms off. |
| Scribbling | Wary in 2 seconds, annoyed in 12, angry in 22, furious in about 32. The fast route, on purpose, and still long enough to see each mood. |
| Pinching | Ow at 0.5 s, wary at 2, annoyed at 12, angry at 22, a swat when you let go if angry. |
| Poking | Fine, and tickling is better. Four quick pokes make him annoyed. |
| Holding him | Amused for 6 seconds, confused for 2, struggling for 5, angry for 6, tired for 6, limp after that. |
| Swinging | Giggling, a little faster the harder you swing. |
| Shaking | Queasy after 1.5 seconds of strong shaking, dizzy after 3 of violent. |

## 4. Priority: what he is doing wins over what you did

From highest to lowest. A higher one can interrupt a lower one, never the other way round.

1. **Held**, and the fall, throw, landing and dazed sequence that follows it.
2. **Pick-up and pinch starting.** A press can interrupt almost anything: he is picked up within one frame, in the grabbed pose, whatever he was doing (only the first 0.15 s of popping out of the ground and digging in are not interruptible).
3. **Mood reactions** (furious, angry, annoyed, wary, bliss, happy, tickle).
4. **Reactions to the pointer and the page** (flee, play, notice, stare, click near, theme switch).
5. **Standing around** (running, digging, sniffing, yawning, sleeping).

**Sequences are committed.** Once a reaction has started it plays to its end. A lower-priority event during it never cancels or replaces it: it is dropped, or queued once (only the last one) and played afterwards if it is still true 2 seconds later. Mood meters keep updating underneath, but a stage change that would show a new reaction waits until the sequence ends. The only things that can interrupt a committed sequence are **being picked up** (a press always works) and hiding him with the footer button. Committed: poke, tickle, stomp, swat, sulk, landing, jump for joy, the dazed sequence, the wave, a dig down and coming up, and a play dash. Not committed (they can be replaced by something more important): standing around, looking at the pointer, running to a spot.

## 5. Sequences: beats and timings

Every reaction is built from **beats**: anticipation (a short pose that tells you something is about to happen), action, reaction (the result), and settle (back to normal). Each frame has its own hold time in milliseconds instead of one frame rate for the whole animation. Anticipation is slow and the action is quick, which is what makes the motion read at 12 frames a second. Code-driven motion (a hop, a bounce, a shuffle) uses ease-out going up or away, and ease-in coming down, never linear.

**Response budget.** The first visible change after an input is within 100 ms: the pose changes on the next frame after the gesture is classified, the cursor changes at the first movement over him (before the gesture is confirmed), and a heart or exclamation mark appears the same frame. Reactions are asymmetric: a press reacts in 80 to 120 ms, the release settles in 200 to 300 ms.

| Sequence | Beats (frame: ms) |
|---|---|
| **Poke** | surprised 90, hop up (code, ease-out) 110, down 90, smug 140 |
| **Tickle** | grabbed-style squirm (laugh 1) 110, laugh 2, 3, 4 at 110 each, repeated for 1.5 s, then happy 200 |
| **Pet, happy** | wiggle frames 160 each, a small heart every 0.8 s |
| **Pet, bliss** | blissful 330, laugh 140 x 4 (every other loop), a big heart every 0.8 s |
| **Wary** | a glance at the pointer 180, shake head 140 x 2, back to what he was doing |
| **Annoyed** | annoyed 250 x 2, turn away 200, run 150 px (ease-out), turn back 200 |
| **Angry** | puff 200, shake head 150, puff 200, exclamation mark |
| **Furious** | puff 200 (anticipation), stomp 160 x 4, then storm off with dust every 0.25 s |
| **Pinch** | ow 160, cheek stretched 400, squished 400 (alternating while held), cheek rub 280 x 3 on release |
| **Held** | grabbed 120 (the exclamation mark lands now), dangle by velocity, sparkle every 0.7 s (amused); question mark; struggle 100 per frame |
| **Swing** | dangle left/centre/right follows the pointer velocity at 60 fps, a giggle (laugh) when it passes the middle |
| **Fall** | tumble 125 per frame, 4 frames, loop |
| **Landing** | squash 80, bounce 140, squash 110, then the reaction (about 0.33 s) |
| **Throw** | tumble while flying, bounces off walls at 50% speed, a small squash on each bounce, at most 3 bounces |
| **Jump for joy** | crouch 150 (anticipation), launch 90, kick 110, kick 110, soft landing 140, laugh 200, excited 600 |
| **Dazed** | sway 250 per frame for 1.4 s, head shake 160, rub head 330, confused 500, wobble 330, get up 300 per frame |
| **Run** | 6 frames at 83 ms (12 fps), a dust puff at the first step, 0.15 s to speed up, 0.2 to stop, a flip pause of 60 ms when he turns |
| **Dig, sink, pop out** | the existing frames and dirt effects stay as they are (owner's decision): dig 4 frames at 125 ms, sink 4 at 170, pop out 4 at 170; underground he moves at run speed with dirt every 0.14 s |
| **Play** | run alongside the pointer, a stop when it stops: gaze 400, excited 500 |
| **Wave (first notice, come back)** | surprised 120, excited 300, back to what he was doing |

Everything above is interruptible. A new gesture does not wait for the sequence to finish; it starts its own beat from the current pose.

## 6. How he moves

- **He only runs.** One run cycle, 12 fps. Speed 140 px a second per unit of scale, with 0.15 seconds to speed up and 0.2 to slow down, so starts and stops are never instant. He only flips direction at the start of a run.
- **A rhythm, not a random pick.** Run (a dash of 220 to 700 px, 1 to 4 seconds), then pause (0.6 to 2 seconds, with one small idle action: look, sniff, yawn, mischievous grin). Every third pause something bigger: dig and come up elsewhere, a mood frame (proud, bored, cheeky), or sleep if it has been quiet for 25 seconds.
- **Keeps on screen** within a margin of 20% of his size from each edge, except when entering or leaving. While held he is damped against the edges, like a rubber band, not stopped dead; thrown, he bounces.
- **Mood changes where he goes.**
  - Happy or bliss: he follows the pointer along the bottom of the screen, staying 100 to 200 px away (he never covers it), and does not run from it. This is the follow and play the owner asked for. It stops after 8 seconds of the pointer not moving, or when he gets wary.
  - Wary: he keeps 250 px away.
  - Annoyed or angry: he moves off after each warning (one 150 px run), then turns to face the pointer.
  - Furious: storms off the nearest edge.
- **Play** (section 2) overrides the rhythm while it lasts, at most 6 seconds, and never when irritation is above 20.
- **Curious walk:** a pointer low on the screen for 3 seconds, 150 to 600 px away: he runs to 120 px from it and sniffs, at most once every 12 seconds, never when irritation is above 20.
- **Sleeping** only after 25 seconds with no interaction and the pointer far away. He wakes when the pointer comes within 180 px, or after 14 seconds.
- **Docs open:** he digs down at once and comes back 1.5 seconds after they close.

## 7. Effects: when each one fires

Each effect has a trigger, a rate limit, and a shared cap of 6 on screen. Dust and dirt are free to repeat because they are small and short; hearts, anger marks and question marks are rationed, because they carry meaning. With reduced motion only the heart (static) and the exclamation mark show.

| Effect | Fires when | Rate limit |
|---|---|---|
| Small heart | Poke, tickle, petting (happy) | One every 0.8 seconds |
| Big heart | Bliss or overjoyed | One every 0.8 seconds |
| Sparkle | Amused while held or swung | Every 0.7 seconds (0.35 when swung hard) |
| Question mark | Confused while held, click near him on a link | Once per phase |
| Exclamation mark | Grabbed, pinched (start), charged at, woken up, theme switch | Once per event |
| Sweat drop | Struggling, tired, queasy | Every 1.2 seconds |
| Anger mark | Annoyed, angry, stomping | Every 1.2 seconds (0.5 when angry), at most 2 on screen |
| Zzz | Sleeping | Every 1.5 seconds |
| Dust | Landing, a bounce, the first step of a run, fleeing, storming off | Once at the start; every 0.25 seconds while fleeing or storming |
| Dirt | Digging | Every 0.22 seconds while digging, every 0.14 underground |

Stars, motion marks and question marks that are part of a frame (the dazed, pinched and wobble sheets) are not drawn in code as well.

## 8. Cursor

The mapping stays, now driven by the classifier and the stage, and it switches on the first movement over him, before the gesture is confirmed: pet hand while petting, the heart hand in bliss and overjoyed, pinch while pinching, shaking fist while shaking, the stop hand when angry or furious, thumbs up after a jump for joy, the open hand when he can be grabbed, the fist when held.

## 9. Accessibility and devices

- He is decoration. Nothing on the page depends on him, he is hidden from assistive technology, and the footer button (a normal, keyboard-focusable button) hides, brings back or calls him, with no animation tied to that button.
- **Reduced motion:** he never turns up on his own and never runs; the button calls him and he stands still. He can still be poked, petted and picked up, with static poses, a static heart, and an instant drop. Sequences that are all motion (the dazed sway, the tumble, the jump) become a single pose held for the same time.
- **Touch:** the hit area is at least 44 px, a drag picks him up (and the page does not scroll from his box), a quick tap pokes, a long press pinches, only the first finger counts, and nothing relies on hover.
- **Pointer capture** while he is held, so fast moves do not drop him.
- **Tab hidden:** everything pauses; when you come back after a minute he waves.

## 10. Build plan

| Step | Work |
|---|---|
| 1 | `tuning.ts` with every number above, a `?mole=debug` overlay (meters, stage, gesture, state), and per-frame durations in `frames.ts` |
| 2 | `input.ts`, the gesture classifier as pure code, with unit tests for every row of section 2 (circles count, jitter does not, taps, tickle, pinch, shake windows, throw, play, charge) |
| 3 | `mood.ts`, the two meters, the stages, dwell times, calm-down and habituation, as pure code on a fake clock, with unit tests for the "what this means in time" table |
| 4 | Rewire the state machine to read gestures and stages, with the priority rules, and interruption from any state |
| 5 | The beats: per-frame timing, the sequences in section 5, easing for code-driven motion |
| 6 | Movement: the run rhythm, mood-dependent movement, play, curious walk, throw physics and edge damping |
| 7 | The page events: first notice, click near, theme switch, Docs open, come back |
| 8 | The effect rules with rate limits and the cap, and the cursor switching on first movement |
| 9 | Browser tests using a `timeScale` setting for tests only (`?mole=pop&speed=8`), so a 40 second sequence runs in 5 |
| 10 | A play session with the owner, then retune `tuning.ts` |

Each step is its own commit on `feature/mole`, and the browser suite stays green after each.

## 11. Art this needs, and what can wait

The 184 frames cover everything, including the existing dig, sink, pop-out and dirt effects, which stay (owner's decision, 2026-10-15). Nothing new is needed for this rework.
- **Throw:** tumble frames and the landing squash. **Poke hop, wave:** existing frames (surprised, excited).
- **Later, for more personality:** a "turn around" pair, a skid-stop frame, a scratch-head and tip-the-helmet pair, and an Ore-nugget dig.

## 12. Owner decisions

**Answered by the owner on 2026-10-15:** he should follow and play with the pointer when he is happy (yes); sequences must not be cancelled or overridden by other things (committed sequences, section 4); looking at the pointer should last a solid while (section 2); petting must not make him angry after a couple of seconds, and phases and mood changes should be longer (section 3); the existing dig and ground effect stay as they are.

**Still open:**
1. **How long of non-stop gentle petting before he storms off?** The proposal is now close to 2 minutes. Shorter makes him a toy; longer makes him patient.
2. **Does scribbling count as fast mad?** The proposal says yes (about 30 seconds now), so a jittery mouse is punished and a gentle one is not.
3. **How long does a storm-off last?** Currently 60 seconds away plus a 2 minute grudge.
4. **Run or rest?** The proposal is a run-and-pause rhythm, about 60% running.
5. **Should he dig down when the Docs open, and wave when you come back?** Good manners, but it is more behaviour to maintain.
6. **Throwing:** do you want him thrown across the screen, or only dropped?

## Spare frames (2026-10-16)

An audit found 66 of the 184 drawn atlas frames unused. The ones that read well as single poses were wired into existing reactions, with no new art:

| Frame | Pose | Where it plays |
|---|---|---|
| D11 | Panicking, arms up | The first 0.2 s after he is picked up (`yelp`) |
| E14 | Back turned | The first 2.4 s of a sulk (`turnedAway`), then B10 (`grumpy`) |
| B11 | Gritted teeth | The third beat of mad (`furious`) |
| B12, K11 | Worried, trembling lip | A worried look at the wary stage; a hurt look after a sulk |
| B4, B14, K13 | Content, blushing, shy | The blissful petting cycle and the look when petting stops |
| B3 | Laughing eyes | Every third beat of a tickle |
| B16, G11 | Squint, half-lid | The second and third beats of the stare |
| G5, G6 | Hands over his face | The "ugh" of the annoyed stage (`facepalm`) |
| G12, I7, I10, I11 | Arms up cheering | After the hop for joy (`cheer`), with I8 (`helmetPop`) at the top of the hop |
| I12 | Shrug | An idle fidget |
| I13, I14 | Ducked, startled | The flinch when the pointer charges at him; the wake-up from sleep |
| L6 | Arms up in the air | A thrown Orry who is not cross |
| L7, D12 | Impact lines, then flat on the ground | A big fall: impact, then flat, then the dazed sequence |
| I15, I16 | Digging sideways | Half of the times he leaves for good |

Still unused, on purpose: the old walk cycles (A1 to A12, J1 to J8, H1 to H8, H15, H16), and near-duplicates of frames in use (B6, B9, G7, G8, D16, I-lookalikes). E1 draws a hand, which would clash with the real cursor. A later pass can remove them from the atlas, which needs the atlas rebuilt and every frame number in `frames.ts` re-checked.

## Shaking, bouncing and double reactions (2026-10-16)

Found by recording every state through a matrix of drops, throws and shakes (see `e2e/mole.spec.ts`, the last three tests):

| Problem | Cause | Fix |
|---|---|---|
| Shaken in the air he hung there calmly until queasy after 1.5 s | The scared pose only existed as "queasy" after strong shaking | While held, a shake (3 reversals in 1.2 s) or a swing over 900 px/s shows the panic pose at once, with "!" and sweat marks and a 2.2 px tremble. He is then flung about with the pointer, swinging left and right and flailing when swung slowly. Queasy and dizzy come as before, after 1.5 s of strong and 3 s of violent shaking. |
| He bounced after almost every drop (two or three ground touches from 150 px up) | Any landing faster than 520 px/s bounced, up to three times | Only a thrown Orry (release over 900 px/s) bounces, at most twice, and only above 700 px/s. A drop, even a long one, lands once. |
| After a hard shake he went mad, sulked, looked hurt, then went mad and sulked again | The drop path started the mad reaction without recording the irritation stage, so the mood system fired it again once he was free | The drop records the stage it reacted to (`handledStage`) before starting a recovery, so there is one recovery per fall. |
| One-frame flashes of the wrong pose when a sequence started | A state was entered with a placeholder animation that the first update replaced | Sulk starts on the turned-away frame and a big fall lands on the impact frame. |

All the numbers are in `tuning.ts` (`held.scaredSpeed`, `held.queasyAfter`, `held.jitter`, `bounce`).

## One recovery per fall (2026-10-16, later)

After a fall he plays one recovery, chosen by the fall, and the head shake and helmet fix that used to follow standing up (`shakeOff`, the old "shake" state) is gone.

| The fall | The one recovery |
|---|---|
| Long fall, or a violent shake | The dazed sequence (sways, shakes his head, rubs the bump, looks confused, wobbles, gets up), then he stomps and runs away |
| Shaken, or already angry | Puffs up and sulks, as before |
| Gentle drop, and he is fond of you (bliss or overjoyed) | A hop for joy |
| Any other fall | Stands up (0.45 s), stomps (1.2 s), then runs 350 to 650 px along the bottom, away from the pointer, and carries on |

The stomp-and-run is mild: he does not leave the screen. A real storm-off (furious) is unchanged. Sequences started by a pickup are reset.

## The dazed sequence plays each beat once (2026-10-16, later)

A frame-by-frame look at the recovery after a long fall showed the same dazed, spiral-eyed look three times (the first dazed frames, the sitting-with-stars frame I had added, and the wobble) and two "confused" looks. The sitting frame (D13) and the wobble (M11 to M12) are no longer used. The sequence is now: impact (0.25 s), flat (to 0.8 s), then dazed (1.4 s), shakes his head (0.7 s), rubs the bump (1.1 s), looks confused (1.0 s), gets up (1.2 s), then the stomp and run described above.

## Shorter again (2026-10-16, later still)

The "looks confused" beat (M9 to M10) and the last get-up frame (M16) are no longer used. The dazed sequence is now: impact (0.25 s), flat (to 0.8 s), dazed (1.4 s), shakes his head (0.7 s), rubs the bump (1.1 s), gets up in three frames (0.9 s), then the stomp and run. About 4.1 s of recovery before the stomp.

## Frame reconciliation and what the cursor may do in each state (2026-10-16, after the frame maps)

### What changed in the frames

| Change | Detail |
|---|---|
| Faces removed | The annoyed faces (E8, E9) and the hurt face (K11) are gone, from the code and from the atlas. Annoyed now shows the grumpy face (B10) and the facepalm. After a sulk there is no hurt look. |
| Cut from the atlas | The three old walk cycles (A1 to A8, H1 to H8, J1 to J8), H15, H16, B6, B9, G9, D16, D13, D14, E1, M9 to M12, M16. The cells are blanked (`assets/editable/mole/cut-frames.cjs`), so every frame number is unchanged. The unused `neutral`, `happy`, `eyesClosed` and `shakeOff` animations are removed (B1, B2 and G10 stay in the atlas, unused). |
| Reused | A9 to A12, the leaning-forward run, is now the `scurry`: the flee and the run away after a fall (1.7 times the run speed). B13 is a head-turn look, and G7 with G8 are a glance left and right; both are idle fidgets. D15 is now the first frame of the dazed get-up. |
| Longer | The flinch holds 0.5 s (was 0.2 s) before the scurry. The joy hop is retimed (below). |
| Swat | A pinch held for 1.2 s or more now ends with a swat at the pointer (before, it needed him to be angry). He sulks after it only if he is angry. |

### The hop for joy, in order

Crouch (0.25 s), launch (0.2), kick up A (0.2), the helmet pops at the top (0.25), kick down B (0.2), soft landing (0.25), then the cheer (G12, I7, I10, I11) until 2.4 s. The jump arc peaks while the helmet is up.

### What the user can do, by state

| State | Tap | Stroke his head | Press and hold | Charge at him | Stare or gaze | Pick up | Scribble |
|---|---|---|---|---|---|---|---|
| Awake: idle, run, look | poke, tickle, spam | pets him (refused when angry or furious) | pinch | flinch, scurry | he looks, follows, stares | yes | annoys him |
| Petting | pokes | continues; refused once he is angry | pinch | flinch | ignored | yes | annoys him |
| Drowsy or asleep | only a tap, see the ladder | nothing | nothing | nothing | nothing | yes | annoys him |
| Any sequence (poke, tickle, pinch, swat, annoyed, mad, sulk, stomp, storm-off, flee, joy, falling, landing, dizzy, standing, digging, popping out, peeking) | ignored | ignored | ignored | ignored | ignored | yes, except while sinking, popping out or underground | still annoys him |
| Held | not applicable | not applicable | not applicable | not applicable | not applicable | he is held | the shake counts |

### Sleep

- He only gets drowsy when the pointer has not moved for 15 s and he has been idle for 8 s, with a 25% chance at each decision (it used to be any idle moment after 14 s).
- Drowsy lasts 1.8 s, then he sleeps. The pointer no longer wakes him. He wakes on his own after 25 s with a yawn.
- A tap climbs a ladder, taps counted within 10 s of each other: 1 startled, then he drops off again; 2 grumpy, then he drops off again; 3 angry (puffs, then sulks) and awake. Each tap adds 12 irritation.
- Being picked up wakes him at once (the yelp).

## Reordered after the second frame map (2026-10-16)

| Where | Now |
|---|---|
| Getting fed up | Wary: worried or head shake. Annoyed: the grumpy face, then he shuffles off. Angry (mad, 1.1 s): puff, facepalm, furious. Sulk (3.6 s): the grumpy face. Furious: stomp (1.2 s), then his back turns (0.8 s), then the storm-off. The facepalm moved from the annoyed stage to the angry beats, and the turned back from the sulk to between the stomp and the storm-off. |
| Pinch | Squish (0.3 s), then ow (0.6 s), then stretch and squish alternating. The tongue-out look (cheeky, K16) no longer ends the charge: he just carries on. |
| Landing after a big fall | Flat (0.4 s), impact lines (0.25 s), squash (0.25 s), then the dazed sequence. A short fall is still the squash alone (0.18 s). |
| Getting up after an ordinary fall | The full get-up (D15, M13, M14, M15, 1.2 s) then the stomp and run. The single stand-up frame as its own animation is gone; D15 only exists as the first frame of the get-up. |

## Longer beats (2026-10-16, last)

A person cannot read a reaction that lasts under about half a second, and the first versions had several of them. Every duration now lives in `TUNING.beat` (`tuning.ts`), and a unit test checks that none is under 0.35 s.

| Beat | Before | Now |
|---|---|---|
| Poke: surprised, then smug | 0.4 s each | 0.6 s each |
| Short landing (squash) | 0.18 s | 0.4 s |
| Big landing: flat, impact lines, squash | 0.4, 0.25, 0.25 s | 0.6, 0.4, 0.4 s (1.4 s in all) |
| Pinch: squish, then ow | 0.3, 0.6 s | 0.5, 0.9 s |
| The yelp when picked up or shaken | 0.2 to 0.25 s | 0.45 s |
| The flinch before the scurry | 0.5 s | 0.8 s (the whole charge flee is 1.7 s) |
| Angry beats: puff, facepalm, furious | 0.37 s each | 0.7 s each (2.1 s in all) |
| The stomp | 1.2 s | 2.4 s: two rounds |
| His back turned before the storm-off | 0.8 s | 2.0 s |
| Hop for joy | 1.35 s, then the cheer to 2.4 s | 1.85 s, then the cheer to 3 s: crouch 0.35, launch 0.25, kick up 0.25, helmet pop 0.4, kick down 0.25, soft landing 0.35 |
| Dazed recovery: dazed, head shake, rub, get up | 1.4, 0.7, 1.1, 1.2 s | 1.4, 1.2, 1.1, 1.2 s (4.9 s in all) |
| The startled and grumpy looks on the sleep ladder | 1.4 s | 1.8 s |
| The swat | 0.33 s | 0.6 s |
