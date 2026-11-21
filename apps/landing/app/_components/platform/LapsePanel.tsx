import { ConnectionPlaceholder } from "./ConnectionPlaceholder";

// Hardware builds are timed from a Lapse recording. The link opens Lapse so the builder can record one now; linking a recording
// to the project is not built yet, so the block says so and offers no dead control.
export function LapsePanel() {
  return (
    <ConnectionPlaceholder
      name="Lapse"
      status="Not connected"
      reason="Hardware builds need a Lapse recording. You can record one now, but linking it to this project is not connected yet."
    >
      <a className="pf-btn" href="https://lapse.hackclub.com/timelapse/create" target="_blank" rel="noopener noreferrer">
        Start timelapse
      </a>
    </ConnectionPlaceholder>
  );
}
