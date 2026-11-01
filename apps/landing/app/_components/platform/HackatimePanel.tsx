// Hackatime is the coding-time tracker for software projects. It sits on the project page as an addition to the
// project, not a separate tab. No Hackatime data is read yet: linking waits for Hack Club Auth and for the
// eligible-time rules in plans/01-product-and-program.md, so the panel shows the empty state and a closed link slot.
export function HackatimePanel({ hardware = false }: Readonly<{ hardware?: boolean }>) {
  return (
    <div className="pf-hackatime">
      <p className="pf-panel-lead">
        Link the Hackatime projects that hold this build&apos;s coding time. Linked projects show their time, sessions and
        languages here.
        {hardware ? " Hardware builds also need a Lapse recording." : ""}
      </p>
      <div className="pf-link-slot">+ Link a Hackatime project...</div>
      <p className="pf-hint">Linking opens once Hack Club Auth is connected.</p>
      <p className="pf-total-row">
        <span>Total coding time</span>
        <span>0.0 H</span>
      </p>
    </div>
  );
}
