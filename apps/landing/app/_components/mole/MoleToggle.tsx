"use client";

import { useEffect, useState } from "react";
import { COMMAND_EVENT, STATE_EVENT, type MoleCommand, type MoleStatus } from "./engine";

// The footer button that hides the mole for good (remembered in this browser) and brings it back. For visitors who ask for
// reduced motion the mole never turns up by itself, so there the button calls it.
const send = (command: MoleCommand) => window.dispatchEvent(new CustomEvent(COMMAND_EVENT, { detail: command }));

export function MoleToggle() {
  const [status, setStatus] = useState<MoleStatus>({ enabled: true, visible: false, reduced: false });

  useEffect(() => {
    const onState = (event: Event) => setStatus((event as CustomEvent<MoleStatus>).detail);
    window.addEventListener(STATE_EVENT, onState);
    send("status");
    return () => window.removeEventListener(STATE_EVENT, onState);
  }, []);

  const calling = status.enabled && !status.visible && status.reduced;
  const label = !status.enabled ? "Bring Orry back" : calling ? "Call Orry" : "Hide Orry";
  const command: MoleCommand = !status.enabled ? "show" : calling ? "call" : "hide";

  return (
    <button type="button" className="mole-toggle" onClick={() => send(command)}>
      {label}
    </button>
  );
}
