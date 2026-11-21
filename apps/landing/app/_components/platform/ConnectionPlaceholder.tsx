import type { ReactNode } from "react";
import "./placeholders.css";

// An honest "not connected" block for an outside service (Hack Club Auth, Hackatime, Lapse). It reads no data and makes no
// network call; it says what is missing and why. This component does not disable anything: the caller controls `children`
// and must pass them disabled (or read-only) itself until the service is connected.
export function ConnectionPlaceholder({
  name,
  status,
  reason,
  children,
}: Readonly<{ name: string; status: string; reason: string; children?: ReactNode }>) {
  return (
    <div className="pf-conn" role="group" aria-label={`${name}, ${status}`}>
      <div className="pf-conn-head">
        <span className="pf-conn-name">{name}</span>
        <span className="pf-conn-status">{status}</span>
      </div>
      <p className="pf-conn-reason">{reason}</p>
      {children ? <div className="pf-conn-body">{children}</div> : null}
    </div>
  );
}
