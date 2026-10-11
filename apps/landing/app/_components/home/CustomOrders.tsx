

// Custom orders section ported from the LOADOUT redesign reference.
export function CustomOrders() {
  return (
    <>
      <div className="pit">
        <b>
          −500 M
        </b>
        <span>
          Streb
          <br />
          Custom orders
        </span>
      </div>
      <div className="sect" id="custom-orders">
        <h2 className="h2">
          Custom
          orders
        </h2>
        <p className="lead">
          Reach the relevant track tier, then request equipment outside the planned prize catalog.
        </p>
        <div className="row r3">
          <div className="card sm">
            <div className="ct">
              <span>
                STEP 01
              </span>
            </div>
            <div className="cn">
              Reach a track tier
            </div>
            <div className="m dsc">
              Ship reviewed work and earn Track XP in that field.
            </div>
          </div>
          <div className="card sm">
            <div className="ct">
              <span>
                STEP 02
              </span>
            </div>
            <div className="cn">
              Submit a request
            </div>
            <div className="m dsc">
              Say what you need, why, and which track it fits.
            </div>
          </div>
          <div className="card sm">
            <div className="ct">
              <span>
                STEP 03
              </span>
            </div>
            <div className="cn">
              Review the quote
            </div>
            <div className="m dsc">
              The team checks fit, funding, and delivery, then sends a Bolt quote to accept or decline.
            </div>
          </div>
        </div>
        <p className="note">
          <b>
            Custom Order requests are not open yet.
          </b>{" "}
           A Field Requisition applies only when the approved quote marks it eligible. It does not replace the required track level.
        </p>
      </div>
    </>
  );
}
