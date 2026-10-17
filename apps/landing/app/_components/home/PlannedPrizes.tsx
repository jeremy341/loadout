import Image from "next/image";

// Proposed prizes: each of the eight planned categories shows one example product on a slow belt
// (.ulpi/design/prize-belt.md, .ulpi/design/prize-photos.md). The examples are ideas, not a catalog, and none can be
// ordered yet. Photos are from Pixl (MIT, permission recorded in docs/source-audit/ATTRIBUTION.md).
const PRIZES = [
  { category: "Embedded boards", example: "ESP32 starter kit", ore: "50", photo: "esp32", width: 500, height: 484 },
  { category: "Tools", example: "Soldering iron kit", ore: "60", photo: "soldering-iron", width: 508, height: 525 },
  { category: "Compute", example: "Raspberry Pi 5", ore: "200", photo: "rpi", width: 800, height: 592 },
  { category: "Storage", example: "Samsung T7 SSD", ore: "160", photo: "samsung-t7-ssd", width: 556, height: 534 },
  { category: "Domains", example: "A domain for your project", ore: "24", photo: "domain-grant", width: 800, height: 800 },
  { category: "Fabrication", example: "Bambu Lab A1 Mini 3D printer", ore: "500", photo: "a1-mini", width: 666, height: 800 },
  { category: "Custom equipment", example: "Enclosed 3D printer", ore: "1,000", photo: "centauri-carbon", width: 691, height: 800 },
  { category: "Developer hardware", example: "Framework 16 laptop", ore: "5,000", photo: "framework-16", width: 548, height: 560 },
] as const;

function PrizeList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="pb-half" aria-hidden={hidden || undefined}>
      {PRIZES.map(({ category, example, ore, photo, width, height }) => (
        <li key={category}>
          <div className="card sm pb-card">
            <div className="pb-photo">
              <Image src={`/loadout/prizes/${photo}.webp`} alt="" width={width} height={height} sizes="230px" />
            </div>
            <div className="pb-text">
              <span className="m">{category}</span>
              <span className="pb-name">{example}</span>
              <span className="m pb-price">{ore} Ore</span>
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
          −200 M
        </b>
        <span>
          <span lang="de">Füllort</span>
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
          Examples of what Ore could buy, at the prices we’re planning.
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
