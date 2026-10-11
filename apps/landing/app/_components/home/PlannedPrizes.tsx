

// Planned prizes section ported from the LOADOUT redesign reference.
// Icon and name of each planned prize; the cards carry no other text.
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
          Planned prizes may include developer hardware, boards, compute, tools, storage, fabrication, domains, and custom equipment. None are currently available to order.
        </p>
        <div className="row g2">
          {PRIZES.map(([icon, name]) => (
            <div className="card sm" key={name}>
              <div className="ct">
                <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                  <use href={"#i-" + icon}></use>
                </svg>
              </div>
              <div className="cn">
                <span style={{ fontSize: "22px" }}>{name}</span>
              </div>
              <div className="m dsc"></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
