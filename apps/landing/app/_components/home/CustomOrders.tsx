

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
          Reach the relevant track tier, describe what you need, and receive a custom Bolt quote for equipment outside the planned prize catalog.
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
              Ship reviewed work and earn enough Track XP in the relevant field.
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
              Explain what you need, how it supports your work, and which track it belongs to.
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
              The team checks fit, funding, and delivery, then gives you a final Bolt quote to accept or decline.
            </div>
          </div>
        </div>
        <div className="chips">
          <span className="chip">
            Requires track level
          </span>
          <span className="chip">
            Custom quote
          </span>
          <span className="chip">
            Accept or decline
          </span>
        </div>
        <p className="note">
          <b>
            Custom Order requests are not open yet.
          </b>{" "}
           A matching Field Requisition may apply an extra discount to an eligible quote. It does not replace the required track level.
        </p>
      </div>
    </>
  );
}
