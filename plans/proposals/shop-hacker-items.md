# Shop: hacker items and laptop pricing

**Status: approved on 25 Nov 2026 and in the working catalog. Prices stay provisional until the shop opens.** [Plan 02](../02-economy-and-rewards.md) owns rates, Ore and Requisitions.

The test for every item: it lets a builder make, test, run, measure or learn something they could not before.

## Price formula

- Ore = USD ÷ 0.435 (10 Ore = $4.35), rounded to 5. $25 grants use 60 Ore to match the current catalog.
- Tax and shipping are not included.
- "Checked" means a search on 25 Nov 2026 found the figure; sources are linked below. "Estimate" means no price was found. Prices moved several times in 2026, so recheck all of them on the day the catalog changes.

## Laptops

Any laptop is allowed. Apple computers cost more Ore per dollar than other computers.

**Rule:** an Apple computer's base price is the formula price × 1.25. It covers MacBooks and Mac desktops, not iPads or the developer membership. Level discounts and Requisitions then work as usual on that base.

**Grant loophole, closed:** the old "$50 laptop grant" (115 Ore) stacked, so a builder could have collected grants toward a MacBook at the PC rate. It is split:

| Grant | Ore | Can pay for |
| --- | --- | --- |
| $50 PC laptop grant | 115 | Any non-Apple laptop, new or refurbished |
| $50 Mac grant | 145 | Any Mac |

The same limit applies to Custom Orders: a Mac quote uses the Mac rate.

| Entry | USD (checked) | Before | Now |
| --- | --- | --- | --- |
| Refurbished ThinkPad grant (T14 Gen 2 class, 16 GB) | 350 (listings run about 300 to 450 and up) | new | 805 |
| Framework 12, prebuilt | 699 | 1,260 | 1,605 |
| Framework 16, prebuilt | 1,839 (early October review; may have risen since) | 2,915 | 4,230 |
| MacBook Neo | 699 | new | 2,010 |
| MacBook Air 13" | 1,299 | 2,295 | 3,735 |
| Mac mini (not a laptop, same rule) | 899 | 1,380 | 2,585 |

The Framework 12 and MacBook Neo both list at $699: 1,605 Ore against 2,010.

The earlier Framework prices were close to the do-it-yourself starting prices. Confirm what that edition leaves out (memory, storage, operating system) before choosing it over prebuilt. Framework 13 and MacBook Pro need a quote from the maker's store, so they are not priced here.

Other factors for the same MacBook Air:

| Factor | Ore |
| --- | --- |
| 1.00 (no premium) | 2,985 |
| 1.15 | 3,435 |
| **1.25 (approved)** | **3,735** |
| 1.40 | 4,180 |

## New items

### First builds

| Item | Tracks | Ore | Price basis | What it unlocks |
| --- | --- | --- | --- | --- |
| $10 electronics parts grant (stackable) | Hardware | 25 | grant | The exact chips, connectors and passives a design needs |
| Serial and flash programmer kit: CH341A class with SOIC clip | Hardware, Systems | 35 | estimate $15 | Read, back up and reflash firmware on devices you own |
| Raspberry Pi Pico 2 W | Hardware | 15 | checked: $7 | RP2350, with Arm and RISC-V cores |
| ESP32 touchscreen board ("cheap yellow display") | Hardware, Tools | 35 | checked: about $8 to $20 | A gadget with a screen and no wiring |
| Crimper and JST/Dupont connector kit | Hardware | 80 | estimate $35 | Cables that stay plugged in |
| $25 PCB assembly grant (stackable) | Hardware | 60 | grant | Surface-mount boards soldered by the fab |
| $25 dedicated server grant (stackable) | Systems, Compute | 60 | grant | Bare metal for kernels, VMs and benchmarks |

### Real tools

| Item | Tracks | Ore | Price basis | What it unlocks |
| --- | --- | --- | --- | --- |
| Bus Pirate 5 | Hardware, Tools | 100 | checked: $42.50 | Talk I2C, SPI and UART from a terminal |
| USB power meter | Hardware | 90 | checked: about $40 | Measure what a build really draws |
| $50 hard drive grant (stackable) | Systems | 115 | grant | Drives for the 2-bay NAS, sold without them |
| KVM over IP (JetKVM class) | Systems | 235 | checked: $103; the JetKVM Mini is about $40 | Run a headless server from BIOS up |
| Portable USB-C monitor | Tools, Hardware | 275 | checked: about $95 to $120 | A bench screen; plan 02 lists portable displays already |

### Big unlocks (Requisition eligible)

| Item | Tracks | Ore | Price basis | What it unlocks |
| --- | --- | --- | --- | --- |
| Used 1-litre mini PC (OptiPlex Micro, ThinkCentre Tiny, EliteDesk Mini) | Systems, Compute | 460 | checked: about $160 to $300 | A homelab node for Proxmox or a small cluster |
| NVIDIA Jetson Orin Nano Super developer kit | Compute, Hardware | 915 | checked: $399 | Local models and robot vision |
| Tiny Tapeout slot (not in the catalog yet) | Hardware, Compute | quote | no US price published | Your own design made as a real chip |

The catalog needs a fixed price, so Tiny Tapeout is a Custom Order until there is one. Set the Ore price from the quote for the shuttle, and tell the builder the expected delivery date before they order. Chip manufacturing takes months.

## Changes to existing items

| Item | Change | Reason |
| --- | --- | --- |
| Jetson Nano developer kit, 230 Ore | Replace with the Orin Nano Super | NVIDIA announced it was phasing the kit out |
| Mac mini, MacBook Air | Reprice as above | Both sit about $300 under current list price even before a premium |
| Framework 12 and 16 | Name the edition, then reprice | See Laptops |
| Raspberry Pi 5, 490 Ore | Name the 8 GB model; keep the price | 8 GB is $180 (415 Ore), which leaves about $33 for a power supply |
| $50 laptop grant | Split into PC and Mac grants | Closes the loophole |
| AirPods Pro, Blåhaj plush | Kept (26 Nov 2026) | Requested. An exception to plan 02 section 26.1, which puts unrelated consumer electronics and generic entertainment out of scope |
| iPad, retro handheld, Kindle | Kept; still the owner's call | Weak build value; each has some argument |

## Left out on purpose

Deauthentication gadgets, RFID cloners and radio transmitters (HackRF class). Builders are 13 to 18, and these raise legal and licensing questions that need a decision first. Receive-only radio (RTL-SDR) is already listed.

## Operating note

The seed switches off the database rows for retired items (`RETIRED_SHOP_IDS` in `shop.ts`). A database that was already seeded needs the seed run again for the removals to take effect.

## Sources

- Apple: [Neo launch price](https://www.macrumors.com/2026/03/04/macbook-neo-499-for-students/), [Mac mini M6](https://macworld.com/article/3220063/apple-launches-new-m6-mac-mini-with-another-price-hike.html), [MacBook Air, late November](https://www.macrumors.com/2026/11/23/m5-macbook-air-now-starts/). Apple's store pages showed no prices to an automated fetch, so these come from news reports.
- Framework: [Laptop 12](https://frame.work/laptop12/?tab=specs), [Notebookcheck on later pricing](https://www.notebookcheck.net/Framework-lowers-Laptop-13-Pro-price-for-everyone-but-there-is-some-bad-news-too.1412014.0.html). The Laptop 16 figure is from a [third-party review](https://techzeeno.com/framework-laptop-16-review/); Framework's own pages refused automated fetches.
- [Refurbished ThinkPad T14 listing](https://www.ebay.com/itm/168141240887), [used mini PC guide](https://computingforgeeks.com/best-used-tiny-pc-homelab/)
- [Raspberry Pi memory price rises](https://raspberrypi.com/news/more-memory-driven-price-rises), [Pi 5 prices, October](https://www.phoronix.com/news/Raspberry-Pi-5-2GB-Price-77.50)
- [Jetson Nano kit end of life](https://forums.developer.nvidia.com/t/jetson-nano-developer-kit-eol/276729), [Jetson price increase](https://cnx-software.com/2026/07/22/nvidia-increases-the-price-of-jetson-modules-and-devkits-by-up-to-101)
- [June 2026 Apple price rise](https://9to5mac.com/2026/06/25/apple-price-increases-mac-ipad/), [Bus Pirate 5](https://dirtypcbs.com/store/details/6633/bus-pirate-5-rev10-with-enclosure), [JetKVM Mini](https://www.cnx-software.com/2026/09/14/jetkvm-mini-a-low-cost-esp32-p4x-based-kvm-with-ethernet-or-wifi-connectivity/), [Pico 2 W](https://www.sparkfun.com/raspberry-pi-pico-2-w.html)
- [Tiny Tapeout](https://tinytapeout.com/)
