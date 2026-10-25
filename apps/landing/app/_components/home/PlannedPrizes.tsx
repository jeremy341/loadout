import Image from "next/image";

// Proposed prizes: each planned category shows one example on a slow belt
// (.ulpi/design/prize-record.md, .ulpi/design/prize-record.md). The examples are ideas, not a catalog, and none can be
// ordered yet. Photos are from Pixl (MIT, permission recorded in docs/source-audit/ATTRIBUTION.md). The flight grant
// and the IRL ticket use LOADOUT's own sprites; the ticket is limited (.ulpi/design/irl-ticket-prize.md).
const PRIZES = [
  { category: "Embedded boards", example: "ESP32 starter kit", ore: 30, photo: "esp32", width: 500, height: 484, icon: false, limited: false },
  { category: "Tools", example: "Soldering iron kit", ore: 80, photo: "soldering-iron", width: 508, height: 525, icon: false, limited: false },
  { category: "Compute", example: "Raspberry Pi 5", ore: 500, photo: "rpi", width: 800, height: 592, icon: false, limited: false },
  { category: "Storage", example: "Samsung T7 SSD", ore: 470, photo: "samsung-t7-ssd", width: 556, height: 534, icon: false, limited: false },
  { category: "Domains", example: "A domain for your project", ore: 25, photo: "domain-grant", width: 800, height: 800, icon: false, limited: false },
  { category: "Fabrication", example: "Bambu Lab A1 Mini 3D printer", ore: 630, photo: "a1-mini", width: 666, height: 800, icon: false, limited: false },
  { category: "Custom equipment", example: "Enclosed 3D printer", ore: 1045, photo: "centauri-carbon", width: 691, height: 800, icon: false, limited: false },
  { category: "Developer hardware", example: "Framework 16 laptop", ore: 2985, photo: "framework-16", width: 548, height: 560, icon: false, limited: false },
  { category: "Travel", example: "$10 flight grant", ore: 20, photo: "ticket", width: 32, height: 32, icon: true, limited: false },
  { category: "Event", example: "Ticket to LOADOUT IRL in Düsseldorf", ore: 700, photo: "people", width: 32, height: 32, icon: true, limited: true },
] as const;

function PrizeList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="pb-half" aria-hidden={hidden || undefined}>
      {PRIZES.map(({ category, example, ore, photo, width, height, icon, limited }) => (
        <li key={category}>
          <div className="card sm pb-card">
            <div className="pb-photo">
              {icon ? (
                <Image className="pb-icon" src={`/loadout/sprites/${photo}.png`} alt="" width={width} height={height} unoptimized />
              ) : (
                <Image src={`/loadout/prizes/${photo}.webp`} alt="" width={width} height={height} sizes="230px" />
              )}
            </div>
            <div className="pb-text">
              <span className="pb-kind">
                <span className="m">{category}</span>
                {limited ? <span className="pb-limited">Limited</span> : null}
              </span>
              <span className="pb-name">{example}</span>
              <span className="pb-ore">{ore.toLocaleString("en-US")} Ore</span>
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
