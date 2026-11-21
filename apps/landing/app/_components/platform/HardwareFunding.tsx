import { usdToOre } from "@/lib/platform/funding";
import { USD_PER_TEN_ORE } from "@/lib/platform/review";
import "./funding.css";

// Hardware funding in Pixl's form: an amount taken from the ship's Ore payout and sent as parts through a fulfilment order.
// The payout does not exist yet (the Ore ledger is not built), so the whole card is disabled and nothing is saved.
export function HardwareFunding() {
  return (
    <div className="pf-fund">
      <label className="pf-fund-check">
        <input type="checkbox" disabled aria-describedby="fund-status" />
        I need funding for parts and shipping
      </label>
      <div className="pf-fund-field">
        <label htmlFor="fund-amount">Amount in dollars</label>
        <div className="pf-fund-money">
          <span aria-hidden="true">$</span>
          <input id="fund-amount" className="pf-input pf-fund-input" type="number" inputMode="decimal" min={0} step={0.01} disabled aria-describedby="fund-ore fund-status" />
        </div>
        <p className="pf-fund-ore" id="fund-ore">
          {usdToOre(0)} Ore at the current rate (10 Ore = ${USD_PER_TEN_ORE.toFixed(2)}). Amounts round up to a whole Ore.
        </p>
      </div>
      <p className="pf-fund-rules">
        If your ship is approved, this amount is taken from your Ore payout for that ship and sent to you as parts through a
        fulfilment order. It can&apos;t be more than what that ship earns.
      </p>
      <p className="pf-fund-status" id="fund-status">
        Not connected yet: the payout deduction starts when the Ore ledger is built.
      </p>
    </div>
  );
}
