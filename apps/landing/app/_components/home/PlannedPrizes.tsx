import Image from "next/image";
import { shopItemById, type ShopItem } from "@/lib/platform/shop";

// Proposed prizes: each planned category shows one example on a slow belt
// (.ulpi/design/prize-record.md, .ulpi/design/prize-record.md). The examples are ideas, not a catalog, and none can be
// ordered yet. Photos are from Pixl (MIT, permission recorded in docs/source-audit/ATTRIBUTION.md). Names and prices come
// from the shop catalog, so the belt cannot drift from it.
const PRIZES = [
  { category: "Embedded boards", id: "esp32-starter-kit", photo: "esp32", width: 500, height: 484, icon: false },
  { category: "Tools", id: "soldering-iron-kit", photo: "soldering-iron", width: 508, height: 525, icon: false },
  { category: "Compute", id: "raspberry-pi-5", photo: "rpi", width: 800, height: 592, icon: false },
  { category: "Domains", id: "domain", photo: "domain-grant", width: 800, height: 800, icon: false },
  { category: "Fabrication", id: "bambu-a1-mini", photo: "a1-mini", width: 666, height: 800, icon: false },
  { category: "Developer hardware", id: "framework-16", photo: "framework-16", width: 548, height: 560, icon: false },
] as const;

// The ids above are checked against the catalog by shop.test.ts.
const catalog = (id: string) => shopItemById(id) as ShopItem;

function PrizeList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="pb-half" aria-hidden={hidden || undefined}>
      {PRIZES.map(({ category, id, photo, width, height, icon }) => {
        const { name, baseOre, limited } = catalog(id);
        return (
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
                <span className="pb-name">{name}</span>
                <span className="pb-ore">{baseOre.toLocaleString("en-US")} Ore</span>
              </div>
            </div>
          </li>
        );
      })}
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
          Prizes
        </h2>
        <p className="lead">
          Examples of what Ore could buy. Working prices, provisional until the shop opens.
        </p>
        <div className="pb">
          <div className="pb-view" role="region" aria-label="Prizes" tabIndex={0}>
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
