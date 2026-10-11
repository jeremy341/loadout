

// Planned prizes section ported from the LOADOUT redesign reference.
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
          <div className="card sm">
            <div className="ct">
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-laptop"></use>
              </svg>
            </div>
            <div className="cn">
              <span style={{ fontSize: "22px" }}>
                Developer hardware
              </span>
            </div>
            <div className="m dsc"></div>
          </div>
          <div className="card sm">
            <div className="ct">
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-board"></use>
              </svg>
            </div>
            <div className="cn">
              <span style={{ fontSize: "22px" }}>
                Embedded boards
              </span>
            </div>
            <div className="m dsc"></div>
          </div>
          <div className="card sm">
            <div className="ct">
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-cpu"></use>
              </svg>
            </div>
            <div className="cn">
              <span style={{ fontSize: "22px" }}>
                Compute
              </span>
            </div>
            <div className="m dsc"></div>
          </div>
          <div className="card sm">
            <div className="ct">
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-wrench"></use>
              </svg>
            </div>
            <div className="cn">
              <span style={{ fontSize: "22px" }}>
                Tools
              </span>
            </div>
            <div className="m dsc"></div>
          </div>
          <div className="card sm">
            <div className="ct">
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-storage"></use>
              </svg>
            </div>
            <div className="cn">
              <span style={{ fontSize: "22px" }}>
                Storage
              </span>
            </div>
            <div className="m dsc"></div>
          </div>
          <div className="card sm">
            <div className="ct">
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-flask"></use>
              </svg>
            </div>
            <div className="cn">
              <span style={{ fontSize: "22px" }}>
                Fabrication
              </span>
            </div>
            <div className="m dsc"></div>
          </div>
          <div className="card sm">
            <div className="ct">
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-domain"></use>
              </svg>
            </div>
            <div className="cn">
              <span style={{ fontSize: "22px" }}>
                Domains
              </span>
            </div>
            <div className="m dsc"></div>
          </div>
          <div className="card sm">
            <div className="ct">
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-equipment-box"></use>
              </svg>
            </div>
            <div className="cn">
              <span style={{ fontSize: "22px" }}>
                Custom equipment
              </span>
            </div>
            <div className="m dsc"></div>
          </div>
        </div>
      </div>
    </>
  );
}
