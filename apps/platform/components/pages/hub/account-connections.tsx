"use client";

import { useEffect, useRef, useState } from "react";
import { pushNotification } from "../../../lib/notifications";
import { Panel, Tag } from "../../ui/ui";
import { nowIso } from "./actions";
import { CONNECTIONS, type ConnectionInfo } from "./data";
import { connect, disconnect, type ConnectionId } from "./logic/account";
import { formatDayUtc } from "./logic/text";
import { CheckRow, InlineConfirm } from "./shared";
import { useConnections } from "./state";

// Hackatime, Lapse, Slack and the Hack Club identity. Connecting is simulated: no service is contacted and no
// token exists. The card still shows what would be read and asks for consent, so the real flow has a place to land.

export function ConnectionsTab({ announce }: { announce: (message: string) => void }) {
  const { state, set } = useConnections();
  const [openId, setOpenId] = useState<ConnectionId | null>(null);
  const [consent, setConsent] = useState(false);
  const [confirming, setConfirming] = useState<ConnectionId | null>(null);
  const buttons = useRef<Partial<Record<ConnectionId, HTMLButtonElement | null>>>({});
  const focusNext = useRef<ConnectionId | null>(null);

  // Put focus back on the card's main button after the card changes state.
  useEffect(() => {
    if (focusNext.current) buttons.current[focusNext.current]?.focus();
    focusNext.current = null;
  });

  function startConnect(id: ConnectionId) {
    setOpenId(id);
    setConsent(false);
    setConfirming(null);
  }

  function doConnect(info: ConnectionInfo) {
    const result = connect(state, info.id, consent, nowIso());
    if (!result.ok) {
      announce(result.error);
      return;
    }
    set(result.state);
    setOpenId(null);
    setConsent(false);
    pushNotification({ kind: "system", title: `${info.name} connected (preview)`, body: "This is a simulated connection. Nothing was sent to or read from the service.", href: "/account" });
    announce(`${info.name} connected (simulated).`);
    focusNext.current = info.id;
  }

  function doDisconnect(info: ConnectionInfo) {
    set(disconnect(state, info.id));
    setConfirming(null);
    announce(`${info.name} disconnected.`);
    focusNext.current = info.id;
  }

  return (
    <div className="pg-stack">
      <Panel title="Connected services">
        <p className="mut">
          Connections are simulated in this preview. Nothing is sent to Hack Club, Hackatime, Lapse or Slack, and the scopes shown are drafts to confirm with each
          service.
        </p>
        <ul className="card-grid hb-connections">
          {CONNECTIONS.map((info) => {
            const at = state[info.id];
            const connected = at !== null;
            return (
              <li key={info.id} className="card hb-connection">
                <h3>{info.name}</h3>
                <p>
                  <Tag tone={connected ? "ok" : "plain"}>{connected ? "Connected" : "Not connected"}</Tag> <Tag>Simulated</Tag>
                </p>
                <p>{info.purpose}</p>
                <p className="mut hb-help">{connected && at ? `Connected ${formatDayUtc(at)} (UTC).` : "Not connected."}</p>
                <div>
                  <p className="hb-scope-title">What it would read (draft)</p>
                  <ul className="hb-plain">
                    {info.scopes.map((scope) => (
                      <li key={scope}>{scope}</li>
                    ))}
                  </ul>
                </div>
                <p className="mut hb-help">{info.note}</p>

                {connected ? (
                  confirming === info.id ? (
                    <InlineConfirm
                      message={`Disconnect ${info.name}? You can connect it again later.`}
                      confirmLabel={`Disconnect ${info.name}`}
                      cancelLabel="Stay connected"
                      onConfirm={() => doDisconnect(info)}
                      onCancel={() => {
                        setConfirming(null);
                        focusNext.current = info.id;
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      ref={(node) => {
                        buttons.current[info.id] = node;
                      }}
                      className="btn btn-danger btn-sm"
                      onClick={() => setConfirming(info.id)}
                    >
                      Disconnect<span className="sr-only"> {info.name}</span>
                    </button>
                  )
                ) : openId === info.id ? (
                  <div className="hb-consent">
                    <CheckRow label="Consent" help={info.consent} checked={consent} onChange={setConsent} />
                    <div className="pg-actions">
                      <button type="button" className="btn btn-sm" disabled={!consent} onClick={() => doConnect(info)}>
                        Connect (simulated)
                      </button>
                      <button
                        type="button"
                        className="btn btn-quiet btn-sm"
                        onClick={() => {
                          setOpenId(null);
                          focusNext.current = info.id;
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    ref={(node) => {
                      buttons.current[info.id] = node;
                    }}
                    className="btn btn-sm"
                    onClick={() => startConnect(info.id)}
                  >
                    Connect<span className="sr-only"> {info.name}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
