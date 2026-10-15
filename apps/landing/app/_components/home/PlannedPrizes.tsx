import Image from "next/image";

// Proposed prizes: each of the eight planned categories shows one example product on a slow belt
// (.ulpi/design/prize-belt.md, .ulpi/design/prize-photos.md). The examples are ideas, not a catalog, and none can be
// ordered yet. Photos are from Pixl (MIT, permission recorded in docs/source-audit/ATTRIBUTION.md).
const PRIZES = [
  { category: "Developer hardware", example: "Framework 16 laptop", photo: "framework-16", width: 548, height: 560 },
  { category: "Embedded boards", example: "ESP32 starter kit", photo: "esp32", width: 500, height: 484 },
  { category: "Compute", example: "Raspberry Pi 5", photo: "rpi", width: 800, height: 592 },
  { category: "Tools", example: "Soldering iron kit", photo: "soldering-iron", width: 508, height: 525 },
  { category: "Storage", example: "Samsung T7 SSD", photo: "samsung-t7-ssd", width: 556, height: 534 },
  { category: "Fabrication", example: "Bambu Lab A1 Mini 3D printer", photo: "a1-mini", width: 666, height: 800 },
  { category: "Domains", example: "A domain for your project", photo: "domain-grant", width: 800, height: 800 },
  { category: "Custom equipment", example: "Enclosed 3D printer", photo: "centauri-carbon", width: 691, height: 800 },
] as const;

function PrizeList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="pb-half" aria-hidden={hidden || undefined}>
      {PRIZES.map(({ category, example, photo, width, height }) => (
        <li key={category}>
          <div className="card sm pb-card">
            <div className="pb-photo">
              <Image src={`/loadout/prizes/${photo}.webp`} alt="" width={width} height={height} sizes="230px" />
            </div>
            <div className="pb-text">
              <span className="m">{category}</span>
              <span className="pb-name">{example}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PlannedPrizes() {
  return (
    <>
      <div className="pit">
        <b>
          −400 M
        </b>
        <span>
          Strecke
          <br />
          Prizes
        </span>
      </div>
      <div className="sect" id="shop">
        <h2 className="h2">
          Proposed
          prizes
        </h2>
        <p className="lead">
          These are examples of what Ore could buy. None are available to order yet.
        </p>
        <div className="pb">
          <div className="pb-view" role="region" aria-label="Proposed prize examples" tabIndex={0}>
            <div className="pb-track">
              <PrizeList />
              <PrizeList hidden />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
