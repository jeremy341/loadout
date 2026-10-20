> **Archived 2026-10-20:** completed or superseded design brief, kept for provenance. Current visual authority: [design system](../../../docs/design/system/design-system.md).

# Hero workshop background

Status: abandoned on 11 October 2026 by owner decision. Nothing renders this background. `HeroWorkshopBackground.tsx`, `hero-workshop-background.css` and the `hero-workshop` PNGs are kept as assets; wiring them into the hero needs a new owner decision.

Earlier status: owner-approved background-only implementation, 2026-10-08. Bind to DESIGN.md existing paper/graphite/yellow pixel identity.

Reference: workspace `New homepage designs/Industrielle Pixel-Art-Werkstatt mit Freiraum.png` (1672x941). Compose the individual user-supplied transparent PNGs; the full scene and sprite sheets are references. Six `old pngs` duplicates are not separate art.

## Composition

Current placement request: align upper/lower rail artwork along the same vertical axis on each side without extending or joining the rail ends. Use one proportional sprite scale for the four corners and asset-specific offsets for their transparent gutters. Keep all corner artwork inside the horizontal viewport; adjust decorative marks away from the edge steel where they are clipped. Place the bottom workbench/workstation bases flush with the platform's main top surface. The platform's visible artwork must straddle the hero boundary equally and extend across the entire viewport without cropping its lower half. A clipped inner scenery layer contains the clouds/skyline/upper corners; a separate platform layer can paint below the hero. Preserve foreground geometry, paper tokens, pointer-free decoration, cloud motion and all later sections. No PNG pixel edits, connected rail extensions, content, controls, or new interactions. Desktop/reference/mobile captures must show aligned axes, uncropped platform, flush bases, no horizontal overflow and unchanged hero content. Implementation handoff: frontend engineer edits only HeroWorkshopBackground.tsx and hero-workshop-background.css; root owns visual evidence.

Latest owner amendment: remove the extra rail extensions. The structural frame uses only the four standalone corner PNGs, the single bottom platform, and the smaller decorative PNGs. The approved skyline and original grey clouds retain their placement. Fresh pngs-only captures show all 18 PNG image elements loaded and unchanged foreground geometry at 1920px, 1672px and 390px. Earlier notes about stretched pillar strips are superseded.

Latest owner amendment: remove the hero-local SVG cloud additions and the `ScrollCloud` export used only to render them there. Keep the existing SVG files and the page-wide `PaperScenery` cloud layer unchanged.

Latest owner amendment: restore the original grey SVG clouds. The hero now reuses the existing ScrollCloud component with two sparse cloud variants; the12new PNG clouds no longer render. Scrolling/drift, responsive sizing and reduced-motion behavior come from the original component. Clouds/decorations sit behind the metal structures. The workshop scenery and seamless/lowered floor remain the active composition.

Latest placement amendment: lower the skyline by56px desktop,44px tablet and32px mobile, with its flat base fading into the paper and ending below the hero boundary. Raise the platform so50% of its visible artwork is inside desktop/reference heroes (about48% mobile). Paper colour/grid match the body through the bottom edge. Fresh final-placement captures confirm unchanged foreground geometry, matching paper surfaces, and no horizontal overflow; lint/typecheck pass.

Latest PNG refresh: newest exports are selected across the main New homepage designs folder and unified_rail_sprites, excluding old pngs. Left workbench and right structure come from the main folder; left structure and right workstation come from unified_rail_sprites. Accessories moved into accesorys and retain their existing contents. Four app copies changed with verified source hashes; canvas dimensions remain160x200/240x192. Fresh updated-pngs captures confirm all image elements load and unchanged foreground geometry at the three checked sizes. Original grey SVG clouds remain active.

Add one decorative absolute background inside the existing hero. Cover the global PaperScenery inside hero only with the existing muted-grey paper grid; leave scenery below the hero alone. Use `isolation:isolate`, an aria-hidden/inert background at z-index:-1, overflow:hidden and pointer-events:none. Do not change hero height, padding, hero-inner/frame, text, navigation, controls, badge, side labels or scroll cue. Replace only the hero's existing outer slashes/fragments with this new backdrop.

Industrial pillars frame left/right upper edges; workbench/toolbox and workstation/crates occupy lower outer corners; a low-opacity industrial skyline spans the lower background; a floor/platform anchors the bottom. Keep a wide clear middle around the existing two-line headline and buttons. Native PNGs remain unchanged, use image-rendering:pixelated and proportional scaling. At1920 use scene pieces near2x native scale; reduce/crop to outer edges at smaller widths so art never obscures text or buttons. At narrow screens keep foreground props in a shallow bottom strip and towers at extreme edges; existing layout remains exact.

All31 standalone PNGs in /loadout/hero-workshop are available:6scene pieces,12clouds,13decorations. Place12unique clouds in the side margins at varied heights; their pale/yellow silhouettes follow the reference. Use3slash sizes,4plus sizes and3yellow/3grey pixel triplets as sparse edge registration details, avoiding the central reading area. Decorative sheets are not rendered as backgrounds.

## Interaction and accessibility

Clouds retain subtle horizontal response to hero scrolling, using a small isolated Framer Motion leaf if needed, with static reduced-motion/no-JS fallback. No new text entrance, hover, sprite-frame animation or art generation. All images alt="", aria-hidden parent, noninteractive; background clipped to hero and cannot enlarge body width.

## Handoff

UI agent owns only new HeroWorkshopBackground.tsx, hero-workshop-background.css, and LoadoutHero.tsx (import backdrop and replace3oldbackgroundnodes only). Import scoped CSS from the background component; no global layout import changes. Root owns asset copying and verification. Use mandated7skills as relevant; no SVG/pixel sprite edits or unrelated motion. Finish with screenshot review at1920x1080 and a narrow viewport, existing lint/type/fullbrowser checks. Compare foreground bounding boxes before/after for exact layout preservation.

## Local verification

Rail/platform alignment verified at 1920x1080, 1672x941, 1280x720 and 390x844. Native rail axes use asset gutter offsets with shared proportional scaling; the short desktop breakpoint preserves the unconnected gap. The platform's visible y92..115 artwork centers on the hero boundary, with workstation bases meeting its y96 surface. An extended 1920px capture confirms the lower half is visible below the hero and the platform spans both edges. No body horizontal overflow, browser errors, or differences in the previously measured hero foreground. Existing lint/typecheck pass; no new tests. Fresh evidence is in hero-workshop-aligned-platform.

Gap repair: the floor PNG has6px/5px horizontal alpha gutters and the left structure has10px/8px vertical gutters. Repeating the full canvases produced visible seams. The floor now spans105% width once, and pillar strips stretch through120% height without repeating. Floor/benches/skyline are lowered. Fresh captures are in hero-workshop-background-gap-fix; foreground rectangles remain identical at all three checked sizes, with no horizontal overflow. Lint and typecheck pass for this CSS refinement.

Implemented on feature/hero-workshop-background. Foreground bounding boxes match the deployed baseline at1920x1080,1672x941 and390x844, with no horizontal overflow. All30 image elements load; the31st asset is the repeating floor background. The foreground mask clears the mobile reading area, floor sits below the scroll cue, and reused PNG strips extend the outer pillars. All original PNG bytes are preserved. Lint/typecheck, production build,12unit tests and47existing browser tests pass. Captures and layout-comparison.json are retained in the local hero-workshop-background visualization folder. In-app browser initialization was unavailable; the existing project Playwright capture tooling supplied visual evidence.
