"use client";

import { useEffect, useState } from "react";
import { COMMAND_EVENT, STATE_EVENT, type MoleCommand, type MoleStatus } from "./engine";
import { useMotionPreference } from "../motion-preference";

const send = (command: MoleCommand) => window.dispatchEvent(new CustomEvent(COMMAND_EVENT, { detail: command }));

export function MoleToggle() {
  const { paused } = useMotionPreference();
  const [status, setStatus] = useState<MoleStatus>({ enabled: true, visible: false, reduced: false, paused: true });
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    const onState = (event: Event) => setStatus((event as CustomEvent<MoleStatus>).detail);
    window.addEventListener(STATE_EVENT, onState);
    send("status");
    return () => window.removeEventListener(STATE_EVENT, onState);
  }, [paused]);

  const automaticPaused = paused || status.paused;
  const label = automaticPaused ? status.enabled ? "Disable Orry" : "Enable Orry" : !status.enabled ? "Bring Orry back" : "Hide Orry";
  function act(command: MoleCommand, message: string) { send(command); setFeedback(message); }
  return <div className="mole-controls">
    <button type="button" className="mole-toggle" onClick={() => act(status.enabled ? "hide" : "show", status.enabled ? "Orry is hidden." : automaticPaused ? "Orry returned in a still pose." : "Orry is enabled.")}>{label}</button>
    <details>
      <summary>Play with Orry</summary>
      <div className="mole-actions">
        <button type="button" disabled={status.visible && !automaticPaused} onClick={() => act("call", automaticPaused ? "Orry is here in a still pose." : "Orry is here.")}>Call Orry</button>
        <button type="button" disabled={!status.visible || !status.enabled} onClick={() => act("pet", automaticPaused ? "Orry holds a happy still pose." : "Orry enjoys a gentle pet.")}>Pet Orry</button>
        <button type="button" disabled={!status.visible || !status.enabled} onClick={() => act("move-left", "Orry moved left, as far as the screen allows.")}>Move Orry left</button>
        <button type="button" disabled={!status.visible || !status.enabled} onClick={() => act("move-right", "Orry moved right, as far as the screen allows.")}>Move Orry right</button>
      </div>
      <p role="status" aria-live="polite">{automaticPaused ? "Automatic animations are paused; controls show still poses. " : ""}{feedback}</p>
    </details>
  </div>;
}
