import { discountForHours, LEVEL_HOURS, levelForHours, sampleTrackHours, shownDiscount, TRACKS, type Track } from "./progress";

// The shop catalog and its rules. Every item here is a proposed item at a draft price (the working list in the Docs and on
// the homepage, content/docs/prizes.md): nothing can be ordered yet. The rules follow plans/02 section 26: Ore prices are
// the same everywhere, each item names the tracks it relates to, the best related track's level discount applies and two
// track discounts are never added. An item with no track is General: open to everyone, at the full price. A Field
// Requisition needs a matching track, so General items cannot use one either.

export type ShopTag = Track | "General";
export const SHOP_TAGS: readonly ShopTag[] = [...TRACKS, "General"];

export type ShopItem = {
  id: string;
  name: string;
  kind: string;
  blurb: string;
  // The tracks the item relates to. Empty means General.
  tracks: readonly Track[];
  baseOre: number;
  limited?: boolean;
  // A level needed in one track before the item can be bought. Only the oscilloscope has one, and that is a proposal (plan 02 keeps the
  // equipment gates open); the card and the item page show it.
  need?: { track: Track; level: number };
  photo: string;
  width: number;
  height: number;
  // A small pixel sprite rather than a product photo.
  icon?: boolean;
  // A single-colour brand mark: a "dark" one is black and a "light" one is pale, so the page flips it in the theme where it
  // would otherwise disappear.
  logo?: "dark" | "light";
  // Who took the photo and under what licence, for photos taken from Wikimedia Commons.
  credit?: { by: string; licence: string; url: string };
};

export const ORE_PER_HOUR = 10;
export const REQUISITION_PERCENT = 10;
export const GENERAL_REQUISITION_PERCENT = 10;
export const REQUISITION_MIN_ORE = 400;
// The most two discounts can give together, with a General Requisition on top: LV.20's 20%, one Field Requisition's 10%
// and one General Requisition's 10% make 40% (owner decision, 14 Nov 2026). It was 25%, then 30%.
export const DISCOUNT_CAP_PERCENT = 40;
export const SHOP_QUERY_MAX = 80;

// A pixel sprite from the homepage's own set, for items that are not a physical product (a ticket, a grant) and for any item
// that has no photo yet.
const sprite = (name: string) => ({ photo: `/loadout/sprites/${name}.png`, width: 32, height: 32, icon: true }) as const;

// A photo from Wikimedia Commons under an open licence; the item page credits the photographer.
const commons = (file: string, by: string, licence: string) => ({ by, licence, url: `https://commons.wikimedia.org/wiki/File:${file}` });

// The proposed catalog, grouped by kind: the working prizes from the Docs and the homepage, and more ideas that pass plan
// 02's test of helping someone build, test, run or learn harder technical things. Pixl's, Arcade's and Stasis's lists, Flavortown's
// categories and plan 02's departments were the starting points; food, fashion and general entertainment stay out. Prices
// are drafts at the working rate of 10 Ore = $4.35, rounded to a tidy figure. Photos come from Pixl's shop (the owner says the
// reuse permission covers them, see docs/source-audit/ATTRIBUTION.md) or from Wikimedia Commons with a credit; tickets,
// grants and anything without a photo yet use LOADOUT's own sprites. Limited items first.
export const SHOP_ITEMS: readonly ShopItem[] = [
  // Experiences and travel
  { id: "conference-grant", name: "$50 technical conference grant", kind: "Travel", blurb: "Toward a ticket to a developer or hardware conference.", tracks: [], baseOre: 115, ...sprite("people") },
  { id: "book-grant", name: "$25 technical book grant", kind: "Learning", blurb: "Toward the book that explains the thing you are stuck on.", tracks: [], baseOre: 60, ...sprite("cap") },
  // General gear
  { id: "screwdriver-set", name: "Electric precision screwdriver set", kind: "Bench and lab", blurb: "A powered driver and a case of small bits to open, fix and rebuild almost anything.", tracks: [], baseOre: 70, photo: "/loadout/shop/screwdriver-set.2acd7a24.webp", width: 659, height: 754 },
  { id: "cable-kit", name: "Cable and adapter kit", kind: "Bench and lab", blurb: "USB-C, HDMI and jumper cables and adapters, the ones every build ends up needing.", tracks: [], baseOre: 50, photo: "/loadout/shop/usb-c-cable.aa1489ff.webp", width: 476, height: 274, credit: commons("USB-C_cable_2017_A.jpg", "Fructibus", "CC0") },
  // Tools
  { id: "domain", name: "A domain for your project", kind: "Domains and hosting", blurb: "Register a domain so your tool or service has an address of its own.", tracks: ["Tools"], baseOre: 25, photo: "/loadout/shop/domain.8d536c5c.webp", width: 625, height: 625 },
  { id: "api-credits", name: "$10 API credits", kind: "Software", blurb: "Credits for an AI or developer API to use in what you build. Stack as many as you need.", tracks: ["Tools", "Compute"], baseOre: 25, photo: "/loadout/shop/logo-api.64442a08.webp", width: 800, height: 90, logo: "dark" },
  { id: "mechanical-keyboard", name: "Hot-swap mechanical keyboard", kind: "Desk", blurb: "A compact keyboard you can re-switch and re-map to how you type.", tracks: ["Tools"], baseOre: 85, photo: "/loadout/shop/mechanical-keyboard.8e8af13b.webp", width: 677, height: 235 },
  { id: "ergonomic-mouse", name: "Ergonomic wireless mouse", kind: "Desk", blurb: "A comfortable mouse with programmable buttons for long sessions in an editor.", tracks: ["Tools"], baseOre: 230, photo: "/loadout/shop/ergonomic-mouse.4eaaaf05.webp", width: 800, height: 453 },
  { id: "usb-c-dock", name: "USB-C dock", kind: "Desk", blurb: "One cable for power, a screen and every device on your desk.", tracks: ["Tools"], baseOre: 95, photo: "/loadout/shop/usb-c-dock.f9aa4ca2.webp", width: 439, height: 321, credit: commons("ALMIGHTY_DOCK_C1.jpg", "しろうるり", "Public domain") },
  { id: "monitor", name: "27-inch QHD monitor", kind: "Desk", blurb: "A sharp second screen for the code, the logs and the schematic.", tracks: ["Tools", "Hardware"], baseOre: 460, photo: "/loadout/shop/monitor.ec4c8a47.webp", width: 698, height: 554 },
  { id: "macropad-kit", name: "DIY macropad kit", kind: "Boards", blurb: "Solder your own key pad, then program what every key does.", tracks: ["Tools", "Hardware"], baseOre: 60, photo: "/loadout/shop/macropad.b966d22f.webp", width: 360, height: 227 },
  { id: "security-key", name: "Hardware security key", kind: "Security", blurb: "Protect your accounts and your repos with a key you hold.", tracks: ["Tools", "Systems"], baseOre: 115, photo: "/loadout/shop/security-key.456e4129.webp", width: 214, height: 88, credit: commons("YubiKey_5_NFC.png", "FelixLadd", "CC BY-SA 4.0") },
  { id: "pico-8", name: "PICO-8 license", kind: "Software", blurb: "A tiny fantasy console to build small games in, with its own editor.", tracks: ["Tools"], baseOre: 35, photo: "/loadout/shop/logo-pico8.46043298.webp", width: 800, height: 206, logo: "light" },
  { id: "aseprite", name: "Aseprite license", kind: "Software", blurb: "A pixel art and animation editor, for sprites and game art.", tracks: ["Tools"], baseOre: 50, photo: "/loadout/shop/aseprite.5c1cbca8.webp", width: 746, height: 800 },
  { id: "ide-license", name: "Code editor or IDE license, 1 year", kind: "Software", blurb: "A paid editor or IDE for a year, from a list we agree.", tracks: ["Tools"], baseOre: 230, photo: "/loadout/shop/logo-vscode.595141ce.webp", width: 500, height: 498 },
  { id: "apple-developer", name: "Apple Developer Program, 1 year", kind: "Software", blurb: "The yearly membership you need to put an app on Apple devices.", tracks: ["Tools"], baseOre: 230, photo: "/loadout/shop/logo-apple.5c86531a.webp", width: 672, height: 800, logo: "dark" },
  { id: "google-play", name: "Google Play developer registration", kind: "Software", blurb: "The one-time fee to publish apps on Google Play.", tracks: ["Tools"], baseOre: 60, photo: "/loadout/shop/google-play.974c1f0d.webp", width: 550, height: 550 },
  // Systems
  { id: "vps-year", name: "A year of a small VPS", kind: "Cloud", blurb: "A server of your own, always on, to host what you build.", tracks: ["Systems"], baseOre: 135, photo: "/loadout/shop/hosting-grant.4af66c3d.webp", width: 600, height: 575 },
  { id: "hosting-grant", name: "$10 hosting grant", kind: "Cloud", blurb: "Toward hosting for something you built. Stack as many as you need.", tracks: ["Systems"], baseOre: 25, ...sprite("cloud") },
  { id: "cloud-db-credits", name: "$25 cloud database and storage credits", kind: "Cloud", blurb: "Credits for a managed database and object storage.", tracks: ["Systems"], baseOre: 60, ...sprite("storage") },
  { id: "network-switch", name: "Managed switch and router for a homelab", kind: "Home server", blurb: "Split your network into parts, then learn what each part is doing.", tracks: ["Systems"], baseOre: 135, photo: "/loadout/shop/network-router.51b89b04.webp", width: 500, height: 472, credit: commons("Ubiquiti_edgerouter_x_router.jpg", "Kent Madsen", "CC BY 4.0") },
  { id: "nas", name: "2-bay NAS", kind: "Home server", blurb: "Network storage for backups and shared files. Drives not included.", tracks: ["Systems"], baseOre: 340, photo: "/loadout/shop/nas.70062545.webp", width: 277, height: 270, credit: commons("Synology_Disk_Station_DS223J_-_NAS-Server.jpg", "DYVER", "CC BY-SA 4.0") },
  { id: "mac-mini", name: "Mac mini", kind: "Home server", blurb: "A small, quiet Mac to run builds, servers and test devices.", tracks: ["Systems", "Compute"], baseOre: 1380, photo: "/loadout/shop/mac-mini.cb87c7aa.webp", width: 529, height: 210 },
  { id: "samsung-t7-ssd", name: "Samsung T7 SSD", kind: "Storage", blurb: "Fast portable storage for datasets, builds and backups.", tracks: ["Systems", "Compute"], baseOre: 460, photo: "/loadout/shop/samsung-t7-ssd.8e2cea79.webp", width: 477, height: 437 },
  { id: "raspberry-pi-5", name: "Raspberry Pi 5", kind: "Boards", blurb: "A small Linux computer for servers, robots and anything that needs to stay on.", tracks: ["Hardware", "Systems"], baseOre: 490, photo: "/loadout/shop/raspberry-pi-5.3ef17562.webp", width: 495, height: 386 },
  { id: "pi-zero-2-w", name: "Raspberry Pi Zero 2 W", kind: "Boards", blurb: "A fingernail-sized Linux computer for small always-on projects.", tracks: ["Hardware", "Systems"], baseOre: 35, photo: "/loadout/shop/pi-zero-2-w.e3342cf0.webp", width: 486, height: 282, credit: commons("Raspberry_Pi_Zero_2_W.jpg", "Laserlicht", "CC BY-SA 4.0") },
  // Compute
  { id: "gpu-cloud-credits", name: "$50 of GPU cloud credits", kind: "Cloud", blurb: "Rent a real GPU for a training run or a render. Stack as many as you need.", tracks: ["Compute"], baseOre: 115, photo: "/loadout/shop/gpu-grant.6329de62.webp", width: 675, height: 450 },
  { id: "cpu-cloud-credits", name: "$25 CPU cloud credits", kind: "Cloud", blurb: "Compute time for builds, simulations and batch jobs. Stack as many as you need.", tracks: ["Compute"], baseOre: 60, photo: "/loadout/shop/cpu-grant.f9fb6cc0.webp", width: 600, height: 600 },
  { id: "pc-upgrade-grant", name: "$50 PC upgrade grant", kind: "Upgrades", blurb: "Toward RAM, an SSD or a CPU for the machine you build on. Stack as many as you need.", tracks: ["Compute", "Systems"], baseOre: 115, photo: "/loadout/shop/ram-grant.5fd6af2a.webp", width: 600, height: 450 },
  { id: "fpga-starter-board", name: "FPGA starter board", kind: "Boards", blurb: "Describe a circuit in code and watch it run as real logic.", tracks: ["Hardware", "Compute"], baseOre: 60, photo: "/loadout/shop/fpga-starter-board.33a5f6df.webp", width: 800, height: 259, credit: commons("Sipeed_Tang_Nano_9K_FPGA.jpg", "Popolon", "CC0") },
  { id: "jetson-nano", name: "NVIDIA Jetson Nano developer kit", kind: "Boards", blurb: "A small board for running AI models on a real GPU, away from a data center.", tracks: ["Compute", "Hardware"], baseOre: 230, photo: "/loadout/shop/jetson-nano.c0b713b4.webp", width: 460, height: 319, credit: commons("NVIDIA_Jetson_Nano_Developer_Kit_(47616885631).jpg", "SparkFun Electronics", "CC BY 2.0") },
  { id: "rx-9060", name: "AMD Radeon RX 9060 XT graphics card", kind: "Upgrades", blurb: "A modern graphics card for training models, rendering and testing games at home.", tracks: ["Compute"], baseOre: 805, need: { track: "Compute", level: 8 }, photo: "/loadout/shop/rx-9060.0852d55e.webp", width: 285, height: 172 },
  { id: "framework-12", name: "Framework 12 laptop", kind: "Laptops", blurb: "A compact convertible laptop you can open, repair and upgrade.", tracks: ["Tools", "Systems", "Compute"], baseOre: 1260, photo: "/loadout/shop/framework-12.2b1fc3d1.webp", width: 737, height: 634 },
  { id: "framework-16", name: "Framework 16 laptop", kind: "Laptops", blurb: "A laptop you can open, repair and upgrade, for serious developer work.", tracks: ["Tools", "Systems", "Compute"], baseOre: 2915, photo: "/loadout/shop/framework-16.97b12534.webp", width: 601, height: 503 },
  { id: "laptop-grant", name: "$500 laptop grant", kind: "Laptops", blurb: "Toward a laptop of your choice for serious developer work.", tracks: ["Tools", "Systems", "Compute"], baseOre: 1150, ...sprite("laptop") },
  // Hardware: boards and modules
  { id: "pico-w", name: "Raspberry Pi Pico W", kind: "Boards", blurb: "A tiny, cheap microcontroller with Wi-Fi. Good for a first sensor or a sixth one.", tracks: ["Hardware"], baseOre: 15, photo: "/loadout/shop/pico-w.d04e511d.webp", width: 427, height: 266, credit: commons("RPI_PICO_W_1.jpg", "SparkFun Electronics", "CC BY 2.0") },
  { id: "esp32-starter-kit", name: "ESP32 starter kit", kind: "Boards", blurb: "A Wi-Fi and Bluetooth microcontroller with the parts to start a first build.", tracks: ["Hardware"], baseOre: 30, photo: "/loadout/shop/esp32-starter-kit.108629be.webp", width: 496, height: 475 },
  { id: "arduino-uno", name: "Arduino Uno", kind: "Boards", blurb: "The classic starter board, with a huge library of projects to learn from.", tracks: ["Hardware"], baseOre: 65, photo: "/loadout/shop/arduino-uno.be4e72cc.webp", width: 558, height: 457 },
  { id: "breadboard-kit", name: "Breadboard and component starter kit", kind: "Boards", blurb: "A breadboard, wires, LEDs, resistors and buttons: everything for a first circuit.", tracks: ["Hardware"], baseOre: 50, photo: "/loadout/shop/breadboard-kit.c321b61c.webp", width: 375, height: 299, credit: commons("400_points_breadboard.jpg", "oomlout", "CC BY-SA 2.0") },
  { id: "sensor-kit", name: "Sensor module kit", kind: "Boards", blurb: "Temperature, light, motion, sound and more, ready to plug into a board.", tracks: ["Hardware"], baseOre: 60, photo: "/loadout/shop/sensor-kit.bc3d41d8.webp", width: 448, height: 337, credit: commons("SparkFun_HC-SR04_Ultrasonic-Sensor_13959-01a.jpg", "SparkFun Electronics", "CC BY 2.0") },
  { id: "eink-module", name: "E-ink display module", kind: "Boards", blurb: "A low-power paper-like screen that keeps its picture with the power off.", tracks: ["Hardware"], baseOre: 70, ...sprite("eink") },
  { id: "retro-handheld", name: "Retro handheld console", kind: "Consoles", blurb: "A pocket retro console that runs open-source firmware, to play on and to tinker with.", tracks: [], baseOre: 145, photo: "/loadout/shop/retro-handheld.eda8997a.webp", width: 333, height: 477 },
  { id: "cardputer", name: "M5Stack Cardputer", kind: "Boards", blurb: "A pocket computer with a keyboard, for firmware and radio experiments.", tracks: ["Hardware"], baseOre: 85, ...sprite("cardputer") },
  { id: "lora-node", name: "LoRa mesh node", kind: "Boards", blurb: "A radio board that joins a long-range mesh network, for sensors far from Wi-Fi.", tracks: ["Hardware", "Systems"], baseOre: 95, ...sprite("lora") },
  { id: "robotics-kit", name: "Servo and motor robotics kit", kind: "Boards", blurb: "Servos, motors and a driver board to make something move.", tracks: ["Hardware"], baseOre: 95, photo: "/loadout/shop/robotics-kit.2357e576.webp", width: 254, height: 234, credit: commons("Tower_Pro_SG90_micro_servo_motor.jpg", "Suyash Dwivedi", "CC BY-SA 4.0") },
  { id: "thermal-camera", name: "Thermal camera for your phone", kind: "Bench and lab", blurb: "Clips onto a phone and shows heat as a picture. Find the hot component or the draught.", tracks: ["Hardware"], baseOre: 460, ...sprite("thermal") },
  { id: "flipper-zero", name: "Flipper Zero", kind: "Bench and lab", blurb: "A pocket tool for poking at radio, infrared and access systems you own.", tracks: ["Hardware"], baseOre: 400, photo: "/loadout/shop/flipper-zero.b7c4a596.webp", width: 714, height: 288 },
  // Hardware: bench and lab
  { id: "debug-probe", name: "Raspberry Pi Debug Probe", kind: "Bench and lab", blurb: "Load and debug code on a small board over a cable instead of guessing.", tracks: ["Hardware"], baseOre: 30, ...sprite("probe") },
  { id: "logic-analyzer", name: "USB logic analyzer", kind: "Bench and lab", blurb: "See what two chips are really saying to each other, wire by wire.", tracks: ["Hardware", "Tools"], baseOre: 40, photo: "/loadout/shop/logic-analyzer.c22c20ee.webp", width: 800, height: 538, credit: commons("8_Channel_USB_logic_analyzer_(5172098012).jpg", "Dilshan Jayakody", "CC BY-SA 2.0") },
  { id: "calipers", name: "Digital calipers", kind: "Bench and lab", blurb: "Measure a part to a fraction of a millimetre before you print or order it.", tracks: ["Hardware"], baseOre: 50, photo: "/loadout/shop/calipers.eeddad5c.webp", width: 436, height: 134, credit: commons("2020_Suwmiarka_cyfrowa.jpg", "Jacek Halicki", "CC BY-SA 4.0") },
  { id: "multimeter", name: "Multimeter", kind: "Bench and lab", blurb: "Check voltage, continuity and resistance. The first thing to reach for.", tracks: ["Hardware"], baseOre: 60, photo: "/loadout/shop/multimeter.610fdea9.webp", width: 217, height: 434, credit: commons("UT61D_digital_multimeter_front.jpg", "Anselm Schüler", "CC BY-SA 4.0") },
  { id: "fume-extractor", name: "Fume extractor for soldering", kind: "Bench and lab", blurb: "Pulls solder fumes away from your face while you work.", tracks: ["Hardware"], baseOre: 60, photo: "/loadout/shop/fume-extractor.7026621c.webp", width: 353, height: 534, credit: commons("BOFA_V250.jpeg", "Ivan Albion", "CC BY-SA 3.0") },
  { id: "soldering-iron-kit", name: "Soldering iron kit", kind: "Bench and lab", blurb: "An iron, tips and solder for putting your own boards together.", tracks: ["Hardware"], baseOre: 80, photo: "/loadout/shop/soldering-iron-kit.6262b4d6.webp", width: 508, height: 525 },
  { id: "pinecil", name: "Pinecil smart soldering iron", kind: "Bench and lab", blurb: "A small USB-C powered iron that heats up in seconds.", tracks: ["Hardware"], baseOre: 95, photo: "/loadout/shop/pinecil.8cead421.webp", width: 481, height: 54, credit: commons("Pinecil_USB_C_soldering_iron.jpg", "4300streetcar", "CC BY 4.0") },
  { id: "usb-microscope", name: "USB microscope", kind: "Bench and lab", blurb: "Inspect tiny solder joints and parts on your screen.", tracks: ["Hardware"], baseOre: 95, photo: "/loadout/shop/usb-microscope.b040d3d4.webp", width: 456, height: 375, credit: commons("Digital_USB_microscope.jpg", "Ravi312", "CC BY-SA 4.0") },
  { id: "bench-psu", name: "Adjustable bench power supply", kind: "Bench and lab", blurb: "A steady, adjustable supply with a current limit, so a mistake does not burn a board.", tracks: ["Hardware"], baseOre: 135, ...sprite("psu") },
  { id: "hot-air-station", name: "Hot-air rework station", kind: "Bench and lab", blurb: "Swap tiny surface-mount parts without destroying the board.", tracks: ["Hardware"], baseOre: 160, photo: "/loadout/shop/hot-air-station.6cf0471e.webp", width: 500, height: 242, credit: commons("Accta_301_Soldering_Station.png", "YuriyTer", "CC BY-SA 4.0") },
  { id: "rtl-sdr", name: "RTL-SDR radio", kind: "Bench and lab", blurb: "A USB radio receiver for satellites, aircraft and anything else in the air.", tracks: ["Hardware"], baseOre: 95, photo: "/loadout/shop/rtl-sdr.db1e16bd.webp", width: 198, height: 63, credit: commons("Rtl-sdr.jpg", "Joeceads", "CC BY-SA 4.0") },
  { id: "oscilloscope", name: "Digital oscilloscope", kind: "Bench and lab", blurb: "Four channels to measure signals as they change. A serious step up for hardware debugging.", tracks: ["Hardware"], baseOre: 975, need: { track: "Hardware", level: 8 }, photo: "/loadout/shop/oscilloscope.2997558f.webp", width: 800, height: 507, credit: commons("RIGOL_DS1054Z_Digital_Storage_Oscilloscope.jpg", "Draconichiaro", "CC BY-SA 4.0") },
  // Hardware: fabrication
  { id: "pcb-grant", name: "$10 PCB fabrication grant", kind: "Fabrication", blurb: "Have a board you designed made and posted to you. Stack as many as you need.", tracks: ["Hardware"], baseOre: 25, photo: "/loadout/shop/build-fund.c5fe9c79.webp", width: 634, height: 504 },
  { id: "filament", name: "1 kg of 3D printer filament", kind: "Fabrication", blurb: "A spool of PLA for enclosures, brackets and test parts.", tracks: ["Hardware"], baseOre: 50, photo: "/loadout/shop/filament.78d80551.webp", width: 331, height: 369, credit: commons("ABS_filament_spool.jpg", "Tatár Lehel", "CC BY-SA 3.0") },
  { id: "ender-3-v3", name: "Creality Ender 3 V3 printer", kind: "Fabrication", blurb: "A fast, affordable printer to start making your own parts.", tracks: ["Hardware"], baseOre: 440, photo: "/loadout/shop/ender-3-v3.d19d8be9.webp", width: 377, height: 432 },
  { id: "bambu-a1-mini", name: "Bambu Lab A1 Mini 3D printer", kind: "Fabrication", blurb: "A compact printer for enclosures, brackets and test parts.", tracks: ["Hardware"], baseOre: 615, photo: "/loadout/shop/bambu-a1-mini.65f7dc38.webp", width: 594, height: 730 },
  { id: "enclosed-printer", name: "Enclosed 3D printer", kind: "Fabrication", blurb: "A printer with a closed chamber for stronger materials and long prints.", tracks: ["Hardware"], baseOre: 1020, photo: "/loadout/shop/enclosed-printer.a22981a2.webp", width: 565, height: 715 },
  // From Stardance's prize list, open to everyone at the full price
  { id: "macbook-air", name: "MacBook Air", kind: "Laptops", blurb: "A light laptop with a long battery, for writing, building and shipping code anywhere.", tracks: ["Tools", "Systems", "Compute"], baseOre: 2295, photo: "/loadout/shop/macbook-air.371d09d7.webp", width: 374, height: 227 },
  { id: "ipad", name: "iPad", kind: "Tablets", blurb: "A tablet for sketching designs, reading datasheets and testing apps.", tracks: [], baseOre: 805, photo: "/loadout/shop/ipad.425dd56c.webp", width: 597, height: 663 },
  { id: "meta-quest-3", name: "Meta Quest 3", kind: "Headsets", blurb: "A headset for building and testing VR and mixed-reality projects.", tracks: [], baseOre: 1150, photo: "/loadout/shop/meta-quest-3.b09ce346.webp", width: 401, height: 486 },
  { id: "airpods", name: "AirPods Pro", kind: "Audio", blurb: "Noise-cancelling earbuds for long, deep build sessions.", tracks: [], baseOre: 575, photo: "/loadout/shop/airpods.2567ac1a.webp", width: 627, height: 772 },
  { id: "kindle", name: "Kindle", kind: "Learning", blurb: "Carry datasheets, docs and books for the long build.", tracks: [], baseOre: 255, photo: "/loadout/shop/kindle.320c69cf.webp", width: 518, height: 615 },
  { id: "blahaj", name: "Blåhaj shark plush", kind: "Merch", blurb: "A very soft shark, because every long build needs a mascot.", tracks: [], baseOre: 70, photo: "/loadout/shop/blahaj.8e24e21a.webp", width: 800, height: 459 },
];

export function shopItemById(id: string): ShopItem | null {
  return SHOP_ITEMS.find((item) => item.id === id) ?? null;
}

// Approved hours per track, the sample figures the Overview and track pages show until real hours exist.
export type TrackHours = Record<Track, number>;
export function sampleApprovedHours(): TrackHours {
  return Object.fromEntries(TRACKS.map((track) => [track, sampleTrackHours(track).approved])) as TrackHours;
}

export type ShopPrice = { base: number; track: Track | null; percent: number; final: number };

// The level discount on an item: the best of its related tracks, or nothing for a General item. Never a sum.
export function priceFor(item: ShopItem, approved: TrackHours): ShopPrice {
  let track: Track | null = null;
  let percent = 0;
  for (const related of item.tracks) {
    const earned = shownDiscount(discountForHours(approved[related]));
    if (earned > percent) {
      percent = earned;
      track = related;
    }
  }
  return { base: item.baseOre, track, percent, final: Math.round(item.baseOre * (1 - percent / 100)) };
}

// What a Field Requisition would add (plan 02 section 26.8): another 10% of the base price, on an item of 400 Ore or more
// with a matching track. A General Requisition (owner, 14 Nov 2026) is a second ticket: another 10%, on any item of 400 Ore
// or more, in any track, stacking with the track discount and one Field Requisition. The two together are capped at 40%.
// It is only earned through a Flagship, one per Flagship, and one General Requisition per order.
export function requisitionPreview(
  item: ShopItem,
  price: ShopPrice,
  { general = false }: { general?: boolean } = {},
): { eligible: boolean; percent: number; final: number } {
  const field = item.tracks.length > 0 && item.baseOre >= REQUISITION_MIN_ORE;
  const generalOk = general && item.baseOre >= REQUISITION_MIN_ORE;
  const extra = (field ? REQUISITION_PERCENT : 0) + (generalOk ? GENERAL_REQUISITION_PERCENT : 0);
  const eligible = field || generalOk;
  const percent = eligible ? Math.min(DISCOUNT_CAP_PERCENT, price.percent + extra) : price.percent;
  return { eligible, percent, final: Math.round(item.baseOre * (1 - percent / 100)) };
}

// A level still missing for the item, or null when it can be bought.
export function lockFor(item: ShopItem, approved: TrackHours): { track: Track; level: number; hoursToGo: number } | null {
  if (!item.need) return null;
  const { track, level } = item.need;
  if (levelForHours(approved[track]) >= level) return null;
  return { track, level, hoursToGo: Math.max(0, LEVEL_HOURS[level - 1] - approved[track]) };
}

// Approved hours of work the price comes to, at 10 Ore an hour: 497 Ore is 49.7 H.
export function hoursOfWork(ore: number): number {
  return Number((ore / ORE_PER_HOUR).toFixed(1));
}

export const SHOP_SORTS = ["featured", "low", "high"] as const;
export type ShopSort = (typeof SHOP_SORTS)[number];
export const SHOP_SORT_LABELS: Record<ShopSort, string> = { featured: "Featured", low: "Price low", high: "Price high" };

export type ShopQuery = { q: string; tag: ShopTag | null; sort: ShopSort; afford: boolean };

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

// Reads the search, tag, sort and affordable filters from the address. Anything unknown is ignored, so the page then
// simply shows everything.
export function parseShopQuery(raw: { q?: string | string[]; tag?: string | string[]; sort?: string | string[]; afford?: string | string[] }): ShopQuery {
  const tagText = first(raw.tag).trim().toLowerCase();
  const sortText = first(raw.sort).trim().toLowerCase();
  return {
    q: first(raw.q).trim().slice(0, SHOP_QUERY_MAX),
    tag: SHOP_TAGS.find((tag) => tag.toLowerCase() === tagText) ?? null,
    sort: SHOP_SORTS.find((sort) => sort === sortText) ?? "featured",
    afford: first(raw.afford) === "1",
  };
}

// The address for a view. The default view has no query at all.
export function shopHref(query: ShopQuery, page = 1): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.tag) params.set("tag", query.tag.toLowerCase());
  if (query.sort !== "featured") params.set("sort", query.sort);
  if (query.afford) params.set("afford", "1");
  if (page > 1) params.set("page", String(Math.trunc(page)));
  const text = params.toString();
  return text ? `/dashboard/shop?${text}` : "/dashboard/shop";
}

// The items a view shows, in order. An item with several tracks shows under each of them; General is the items with none.
export function filterShopItems(items: readonly ShopItem[], query: ShopQuery, approved: TrackHours, ore: number): ShopItem[] {
  const shown = items.filter((item) => {
    if (!hasTag(item, query.tag)) return false;
    if (!matchesShopText(item, query.q)) return false;
    if (query.afford && priceFor(item, approved).final > ore) return false;
    return true;
  });
  if (query.sort === "featured") return shown;
  const sign = query.sort === "low" ? 1 : -1;
  return [...shown].sort((a, b) => sign * (priceFor(a, approved).final - priceFor(b, approved).final));
}

// Whether an item sits under a tag. No tag matches everything; General is the items with no track.
export function hasTag(item: ShopItem, tag: ShopTag | null): boolean {
  if (tag === null) return true;
  return tag === "General" ? item.tracks.length === 0 : item.tracks.includes(tag);
}

// The search match: the words in the name, kind or blurb, case ignored. An empty search matches everything.
export function matchesShopText(item: ShopItem, text: string): boolean {
  const needle = text.trim().toLowerCase();
  return needle === "" || `${item.name} ${item.kind} ${item.blurb}`.toLowerCase().includes(needle);
}

// The shop has no dates, so "new" is a hand-set flag on the last entries of the catalog (spec K.5).
export const NEW_ITEM_COUNT = 8;
const NEW_IDS: ReadonlySet<string> = new Set(SHOP_ITEMS.slice(-NEW_ITEM_COUNT).map((entry) => entry.id));

export function isNewItem(item: ShopItem): boolean {
  return NEW_IDS.has(item.id);
}

// The items flagged new, newest first.
export function recentlyAdded(items: readonly ShopItem[] = SHOP_ITEMS): ShopItem[] {
  return items.filter(isNewItem).reverse();
}

// Items whose final price is at or below the Ore balance, the dearest first so the strip leads with the best buy.
export function withinReach(items: readonly ShopItem[], approved: TrackHours, ore: number): ShopItem[] {
  return items.filter((entry) => priceFor(entry, approved).final <= ore).sort((a, b) => priceFor(b, approved).final - priceFor(a, approved).final);
}

// Up to `limit` other items that share a track with this one (or, for a General item, other General items): the ones sharing
// the most tracks first, then the same kind, then the closest price.
export function relatedItems(item: ShopItem, limit = 4, items: readonly ShopItem[] = SHOP_ITEMS): ShopItem[] {
  const scored: { entry: ShopItem; shared: number }[] = [];
  for (const entry of items) {
    if (entry.id === item.id) continue;
    const shared = item.tracks.length === 0 ? (entry.tracks.length === 0 ? 1 : 0) : entry.tracks.filter((track) => item.tracks.includes(track)).length;
    if (shared > 0) scored.push({ entry, shared });
  }
  scored.sort(
    (a, b) =>
      b.shared - a.shared ||
      Number(b.entry.kind === item.kind) - Number(a.entry.kind === item.kind) ||
      Math.abs(a.entry.baseOre - item.baseOre) - Math.abs(b.entry.baseOre - item.baseOre) ||
      a.entry.id.localeCompare(b.entry.id),
  );
  return scored.slice(0, limit).map((row) => row.entry);
}

// The first items under a tag that have a picture worth showing small: a brand mark that has to flip with the theme is left out.
export function categoryThumbs(tag: ShopTag, limit = 3, items: readonly ShopItem[] = SHOP_ITEMS): ShopItem[] {
  return items.filter((entry) => hasTag(entry, tag) && !entry.logo).slice(0, limit);
}

export function categoryCount(tag: ShopTag, items: readonly ShopItem[] = SHOP_ITEMS): number {
  return items.filter((entry) => hasTag(entry, tag)).length;
}

export const SHOP_PAGE_SIZE = 24;

// The page named in the address: a whole number from 1.
export function parseShopPage(raw: { page?: string | string[] }): number {
  const value = Number.parseInt(first(raw.page), 10);
  return Number.isFinite(value) && value >= 1 ? Math.min(value, 1000) : 1;
}

// "Show more" is a link to the next page that keeps everything already shown, so nothing is lost and no script is needed.
export function visibleItems<T>(items: readonly T[], page: number, size = SHOP_PAGE_SIZE): { shown: T[]; total: number; next: number | null } {
  const current = Math.max(1, Math.trunc(page));
  return { shown: items.slice(0, current * size), total: items.length, next: current * size < items.length ? current + 1 : null };
}
