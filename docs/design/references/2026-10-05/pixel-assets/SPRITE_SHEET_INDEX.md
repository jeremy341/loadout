# LOADOUT final pixel icon assets

The active homepage icon art now comes from the owner's final PNG set, preserved in docs/design/references/2026-10-06/final-pixel-icons/source/. That archive has all 42 original files copied from the workspace's finnally/ folder. Each active app sprite is a transparent 32×32 RGBA PNG in apps/landing/public/loadout/sprites/.

The app exports crop each source to its visible alpha bounds and fit it proportionally inside 28×28 pixels using nearest-neighbor sampling. This gives every glyph a 2px transparent margin without adding a background or smoothing the art.

| App sprite | Final source file | LoadoutIcon |
|---|---|---|
| bolt.png | ChatGPT-Bild 6. Okt. 2026, 12_19_58-1.png | bolt |
| layers.png | ChatGPT-Bild 6. Okt. 2026, 12_19_59-2.png | layers |
| code.png | ChatGPT-Bild 6. Okt. 2026, 12_20_00-3.png | code |
| gift.png | ChatGPT-Bild 6. Okt. 2026, 12_20_02-4.png | gift |
| builder.png | ChatGPT-Bild 6. Okt. 2026, 12_20_03-5.png | user |
| list.png | ChatGPT-Bild 6. Okt. 2026, 12_20_05-6.png | list |
| document.png | ChatGPT-Bild 6. Okt. 2026, 12_20_06-7.png | document |
| wrench.png | ChatGPT-Bild 6. Okt. 2026, 12_20_07-8.png | wrench |
| gear.png | ChatGPT-Bild 6. Okt. 2026, 12_20_08-9.png | gear |
| cpu.png | ChatGPT-Bild 6. Okt. 2026, 12_20_10-10.png | chip |
| board.png | ChatGPT-Bild 6. Okt. 2026, 12_22_39-1.png | board |
| flask.png | ChatGPT-Bild 6. Okt. 2026, 12_22_40-2.png | flask |
| globe.png | ChatGPT-Bild 6. Okt. 2026, 12_22_42-3.png | globe |
| arrow-right.png | ChatGPT-Bild 6. Okt. 2026, 12_22_46-5.png | arrow |
| xp-star.png | ChatGPT-Bild 6. Okt. 2026, 12_22_47-6.png | star |
| laptop.png | ChatGPT-Bild 6. Okt. 2026, 12_22_48-7.png | laptop |
| cloud.png | ChatGPT-Bild 6. Okt. 2026, 12_22_49-8.png | cloud |
| equipment-box.png | ChatGPT-Bild 6. Okt. 2026, 12_22_52-10.png | box |
| people.png | 22_worker_team.png | people |
| cap.png | 21_graduation_cap.png | cap |
| hoodie.png | 23_hoodie.png | hoodie |
| terminal.png | 24_terminal.png | terminal |
| domain.png | 25_dev_badge.png | domain |
| ticket.png | 26_ticket.png | ticket |
| storage.png | 27_storage_drive.png | storage |
| check.png | 28_checkmark.png | check |
| cross.png | 29_cross.png | cross |
| down.png | 31_double_down_chevrons.png | down |
| faq-chevron.png | 32_right_chevron.png | faq-chevron |
| requisition-i.png | 33_badge_I.png | requisition-i |
| requisition-ii.png | 34_badge_II.png | requisition-ii |
| requisition-master.png | 35_badge_crown.png | requisition-master |

## Kept separate

The final pixel Bolt is now active in LoadoutIcon. The previous bolt.svg remains in public/loadout as an unused original. The LOADOUT brand mark, wordmark, lockup, and favicon are unchanged. The moving clouds and existing slashes/skyline scene SVGs are unchanged.

The archive also retains source art for the octagon/nut marks, double slashes, house, building, warehouse, layout, and queue. Those cells are references for the brand or scenery and are not loaded as homepage glyphs. No active homepage calls use a Key or Stickers icon.
