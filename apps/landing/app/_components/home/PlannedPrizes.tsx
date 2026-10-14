// Planned prizes section: the planned categories ride a slow belt (.ulpi/design/prize-belt.md).
// Icon and name of each planned prize; the cards carry no other text until real items and prices exist.
const PRIZES = [
  ["laptop", "Developer hardware"],
  ["board", "Embedded boards"],
  ["cpu", "Compute"],
  ["wrench", "Tools"],
  ["storage", "Storage"],
  ["flask", "Fabrication"],
  ["domain", "Domains"],
  ["equipment-box", "Custom equipment"],
] as const;

function PrizeList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="pb-half" aria-hidden={hidden || undefined}>
      {PRIZES.map(([icon, name]) => (
        <li key={name}>
          <div className="card sm pb-card">
            <div className="ct">
              <svg className="ic" viewBox="0 0 32 32" aria-hidden="true">
                <use href={"#i-" + icon}></use>
              </svg>
            </div>
            <div className="cn">
              <span style={{ fontSize: "22px" }}>{name}</span>
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
          Planned prizes
        </span>
      </div>
      <div className="sect" id="shop">
        <h2 className="h2">
          Planned
          prizes
        </h2>
        <p className="lead">
          These are plans. None are available to order yet.
        </p>
        <div className="pb">
          <div className="pb-view" role="region" aria-label="Planned prize categories" tabIndex={0}>
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
