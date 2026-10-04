# Pinned source references

Each folder is an independent Git submodule pinned to the audited upstream commit. The LOADOUT repository records only links and commit IDs; it does not copy these repositories' source trees into its own history.

| Folder | Source role | Pinned commit | License note |
|---|---|---|---|
| `pixl/` | PRIMARY ENGINEERING BASE | `8141b992e92e05583246fd914c63a101100f6fe4` | MIT; upstream notice is in `pixl/LICENSE`. |
| `ysws-template/` | GENERAL YSWS OPERATIONS / INFRASTRUCTURE REFERENCE | `1ac191fa5eee1e57983b29ab7101f700c166e207` | No reuse license identified; do not vendor its code. |
| `stardance/` | PEER REVIEW / QUALITY SCORING / MULTIPLIER SPECIALIST REFERENCE | `3a0fe8148b07c1edfe005e94dfc9d1faa4b64c14` | No reuse license identified; do not vendor its code. |

To populate these folders in a new checkout, use `git clone --recurse-submodules`. To initialize them later, run `git submodule update --init --recursive`.