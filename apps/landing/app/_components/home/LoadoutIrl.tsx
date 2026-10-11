
// Loadout IRL section ported from the LOADOUT redesign reference.
export function LoadoutIrl() {
  return (
    <>
      <div className="pit">
        <b>
          −700 M
        </b>
        <span>
          Wettersohle
          <br />
          LOADOUT IRL
        </span>
      </div>
      <div className="sect" id="loadout-irl">
        <h2 className="h2">
          Loadout IRL
          {"// Ruhr"}
        </h2>
        <p className="lead">
          A proposed three-day hackathon in Germany’s Ruhr area. It is a future concept, not an announced event.
        </p>
        <div className="row r3">
          <div className="card t">
            <div className="ct">
              <span>
                TAG 01 · FRÜHSCHICHT
              </span>
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-list"></use>
              </svg>
            </div>
            <div className="cn">
              Meet &amp; choose
            </div>
            <div className="m dsc">
              Meet in person and choose a technical project.
            </div>
          </div>
          <div className="card t">
            <div className="ct">
              <span>
                TAG 02 · SPÄTSCHICHT
              </span>
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-wrench"></use>
              </svg>
            </div>
            <div className="cn">
              Build together
            </div>
            <div className="m dsc">
              Build side by side with other builders.
            </div>
          </div>
          <div className="card t">
            <div className="ct">
              <span>
                TAG 03 · NACHTSCHICHT
              </span>
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-document"></use>
              </svg>
            </div>
            <div className="cn">
              Share your work
            </div>
            <div className="m dsc">
              Share what you made using LOADOUT’s four tracks.
            </div>
          </div>
        </div>
        <div className="asd" style={{ marginTop: "34px" }}>
          <span className="chip">
            Planned concept
          </span>
          <div className="m dsc" style={{ marginTop: "12px" }}>
            Dates, venue, funding, and registration are not confirmed yet.
          </div>
        </div>
      </div>
    </>
  );
}
