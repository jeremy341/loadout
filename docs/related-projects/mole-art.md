# Mole art

The mole is the interactive homepage mascot, also called Orry. It is an in-repo product asset: the runtime, the built atlas and its animation map live in `apps/landing`.

| Fact | Value |
|---|---|
| Runtime | `apps/landing/app/_components/mole/` |
| Built atlas | `apps/landing/public/loadout/mole/mole.png` and `fx.png` |
| Animation contract | `apps/landing/app/_components/mole/frames.ts` |
| Editable source | `assets/editable/mole/` (build kit, prompts, slice/atlas scripts) |
| Raw sheets and frame pipeline | `art/mole-source/` in the owner's parent workspace (not versioned) |
| Design brief | [`.ulpi/design/mole.md`](../../../.ulpi/design/mole.md) and [`.ulpi/design/mole-behaviour.md`](../../../.ulpi/design/mole-behaviour.md) |

**How it connects.** Only the built atlas ships. If the raw source is lost, the atlas can still be served but cannot be edited or rebuilt. The owner controls whether the raw sheets go into this repository, a release asset, or stay local.

**Contract.** Frame names in `frames.ts` are runtime identifiers. Before replacing the atlas, run `build-atlas.cjs` and compare the output bytes with the live `mole.png`. Do not edit files under `references/`; the mole is original LOADOUT art, not a reference asset.

**Known gap.** The raw sheets and per-frame PNGs are not in this repository. Moving the 64 px frames and manifest into `assets/editable/mole/` is still an open decision; the 11.5 MB raw sheets should not be committed without a deliberate source-storage choice.

Last verified: 2026-10-20.
