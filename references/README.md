# Pinned source references

Each repository is a Git submodule pinned to a reviewed commit. The LOADOUT parent records the remote and commit pointer; source files stay inside the submodule and are not copied into LOADOUT. Reference-only does not grant permission to reuse code, text, or media.

| Folder | Source role | Pinned commit | License / use boundary |
|---|---|---|---|
| [`pixl/`](pixl/) | Primary engineering reference for the landing app | `8141b992e92e05583246fd914c63a101100f6fe4` | MIT; preserve notice and attribution. |
| [`ysws-template/`](ysws-template/) | YSWS operations and infrastructure reference | `1ac191fa5eee1e57983b29ab7101f700c166e207` | No reuse license identified; do not vendor its implementation. |
| [`stardance/`](stardance/) | Peer review, scoring, and virality-bonus reference | `d889f39060a443476a88b98a87d5088033626eff` | No reuse license identified; do not vendor its implementation. |
| [`stasis/`](stasis/) | Hack Club hardware hackathon and event-program reference | `7a230ced9ad793f0ad4cda30a7d71c02a58da6b6` | No LICENSE file or GitHub license metadata found at this pin. Reference-only; obtain permission before reusing code or media. |

## Initialize the references

From a fresh clone, run:

```powershell
git submodule update --init
```

Do not initialize recursively. Stardance has a nested `secrets` submodule whose remote was unavailable at the audited pin. The Stasis pin has no `.gitmodules` file. The source audit records exact pins and permission findings in [`docs/source-audit/source-bases.md`](../docs/source-audit/source-bases.md) and [`decisions.md`](../docs/source-audit/decisions.md).
