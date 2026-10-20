"use client";

import { useEffect, useRef, useState } from "react";
import { Meter, PageHeader, PreviewNote, Panel, Stat, StatGrid, Status, Tag } from "../../ui/ui";
import { COLLECTIBLES, MAX_PINS, RARITY_LABELS, findCollectible, type Collectible } from "./data";
import { claimCollectibleNow, syncCollectibles, togglePinNow, useCollectibleState, useGearStats } from "./gear-store";
import { navLead } from "./gear-nav";
import { Sprite, formatStamp, useAnnounce } from "./gear-ui";
import { cleanPins, progressFor } from "./logic/collectibles";

// No plan defines a collectible catalog, so the catalog, rarities and unlock conditions are Draft preview rules
// (data.ts). Collectibles are earned once and kept. Conditions that can be checked against Gear state unlock by
// themselves; the rest use a "Claim (preview)" button because this preview cannot read Projects or Reviews.

export function CollectiblesPage() {
  const { earned, pins } = useCollectibleState();
  const stats = useGearStats();
  const [message, announce] = useAnnounce();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const returnTo = useRef<string | null>(null);
  const detailRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const fresh = syncCollectibles();
    if (fresh.length > 0) {
      const names = fresh.map((id) => findCollectible(id)?.name).filter(Boolean).join(", ");
      announce(`Earned: ${names}.`);
    }
  }, [announce]);

  useEffect(() => {
    if (selectedId) detailRef.current?.focus();
    else if (returnTo.current) {
      document.getElementById(`gr-col-${returnTo.current}`)?.focus();
      returnTo.current = null;
    }
  }, [selectedId]);

  const owned = COLLECTIBLES.filter((c) => earned[c.id]);
  const locked = COLLECTIBLES.filter((c) => !earned[c.id]);
  const pinned = cleanPins(pins, earned, COLLECTIBLES);
  const selected = selectedId ? findCollectible(selectedId) : undefined;

  function togglePin(c: Collectible) {
    const result = togglePinNow(c.id);
    announce(result.ok ? (result.pinned ? `${c.name} pinned.` : `${c.name} unpinned.`) : result.error);
  }

  function claim(c: Collectible) {
    const result = claimCollectibleNow(c.id);
    announce(result.ok ? `${c.name} claimed (preview).` : result.error);
  }

  return (
    <>
      <PageHeader eyebrow="Gear" title="Collectibles" lead={navLead("collectibles")} />
      <PreviewNote>
        No plan defines a collectible catalog yet, so these collectibles and their unlock conditions are a draft made for the preview. They are saved in this browser, and earning one never changes your Ore.
      </PreviewNote>
      <div className="gr-stack">
        <StatGrid>
          <Stat label="Owned" value={`${owned.length} of ${COLLECTIBLES.length}`} hint="Earned collectibles are kept" />
          <Stat label="Pinned" value={`${pinned.length} of ${MAX_PINS}`} hint="Your favourites" />
        </StatGrid>
        <Status message={message} />

        <Panel title="Pinned">
          <ul className="gr-pins" aria-label="Pinned collectibles">
            {Array.from({ length: MAX_PINS }, (_, index) => {
              const c = pinned[index] ? findCollectible(pinned[index]) : undefined;
              return (
                <li key={index} className="gr-pin-slot" data-empty={c ? "false" : "true"}>
                  {c ? (
                    <>
                      <Sprite name={c.sprite} size={32} />
                      <span>
                        {c.name} <span className="mut">({RARITY_LABELS[c.rarity]})</span>
                      </span>
                    </>
                  ) : (
                    <span>Empty slot {index + 1}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {owned.length === 0 ? <p className="mut">Earn a collectible, then pin up to {MAX_PINS} favourites here.</p> : null}
        </Panel>

        {selected ? (
          <Panel>
            <div className="gr-detail">
              <div className="gr-row">
                <span className="gr-sprite-box">
                  <Sprite name={selected.sprite} size={48} />
                </span>
                <div className="gr-tight">
                  <h2 ref={detailRef} tabIndex={-1} className="gr-focus-target">
                    {selected.name}
                  </h2>
                  <div className="gr-tags">
                    <Tag>{RARITY_LABELS[selected.rarity]}</Tag>
                    <Tag tone={earned[selected.id] ? "ok" : "plain"}>{earned[selected.id] ? "Owned" : "Locked"}</Tag>
                    <Tag>Draft preview rule</Tag>
                  </div>
                </div>
              </div>
              <div className="gr-stack">
                <p>{selected.blurb}</p>
                <p>
                  <strong>How to unlock:</strong>{" "}
                  {selected.condition.type === "stat" ? selected.condition.label : selected.condition.hint}
                </p>
                {earned[selected.id] ? <p className="mut">Earned {formatStamp(earned[selected.id])}.</p> : null}
                <div className="gr-row">
                  <button type="button" className="btn btn-quiet btn-sm" onClick={() => {
                    returnTo.current = selected.id;
                    setSelectedId(null);
                  }}>
                    Close details
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        ) : null}

        <Panel title={`Owned (${owned.length})`}>
          {owned.length === 0 ? (
            <p className="mut">You have not earned any yet. Place an order, save wishlist items or invite a builder to start.</p>
          ) : (
            <ul className="card-grid" aria-label="Owned collectibles">
              {owned.map((c) => (
                <li key={c.id} className="gr-listitem">
                  <CollectibleCard
                    collectible={c}
                    owned
                    pinned={pinned.includes(c.id)}
                    earnedAt={earned[c.id]}
                    progress={null}
                    onDetails={() => setSelectedId(c.id)}
                    onPin={() => togglePin(c)}
                    onClaim={() => undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`Locked (${locked.length})`}>
          {locked.length === 0 ? (
            <p className="mut">Everything is unlocked.</p>
          ) : (
            <ul className="card-grid" aria-label="Locked collectibles">
              {locked.map((c) => {
                const progress = progressFor(c, stats);
                return (
                  <li key={c.id} className="gr-listitem">
                    <CollectibleCard
                      collectible={c}
                      owned={false}
                      pinned={false}
                      earnedAt={undefined}
                      progress={progress}
                      onDetails={() => setSelectedId(c.id)}
                      onPin={() => undefined}
                      onClaim={() => claim(c)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function CollectibleCard({
  collectible,
  owned,
  pinned,
  earnedAt,
  progress,
  onDetails,
  onPin,
  onClaim,
}: {
  collectible: Collectible;
  owned: boolean;
  pinned: boolean;
  earnedAt: string | undefined;
  progress: ReturnType<typeof progressFor>;
  onDetails: () => void;
  onPin: () => void;
  onClaim: () => void;
}) {
  const manual = collectible.condition.type === "manual";
  return (
    <article className="gr-collectible" data-rarity={collectible.rarity} data-owned={owned ? "true" : "false"} aria-label={collectible.name}>
      <div className="gr-row">
        <span className="gr-sprite-box">
          <Sprite name={collectible.sprite} size={40} />
        </span>
        <div className="gr-tight">
          <h3>{collectible.name}</h3>
          <div className="gr-tags">
            <Tag>{RARITY_LABELS[collectible.rarity]}</Tag>
            <Tag tone={owned ? "ok" : "plain"}>{owned ? "Owned" : "Locked"}</Tag>
          </div>
        </div>
      </div>
      <p className="mut">{collectible.blurb}</p>
      {owned && earnedAt ? <p className="mut">Earned {formatStamp(earnedAt)}</p> : null}
      {!owned && progress ? (
        <div className="gr-progress">
          <Meter value={progress.have} max={progress.need} label={`Progress: ${progress.label}`} />
          <p className="mut">
            {progress.label}: {progress.have} of {progress.need}
          </p>
        </div>
      ) : null}
      {!owned && manual && collectible.condition.type === "manual" ? <p className="mut">{collectible.condition.hint}</p> : null}
      <div className="gr-row">
        <button id={`gr-col-${collectible.id}`} type="button" className="btn btn-quiet btn-sm" aria-label={`Details for ${collectible.name}`} onClick={onDetails}>
          Details
        </button>
        {owned ? (
          <button type="button" className="gr-heart" aria-pressed={pinned} aria-label={`Pin ${collectible.name}`} onClick={onPin}>
            <span aria-hidden="true" className="gr-heart-mark">
              {pinned ? "◆" : "◇"}
            </span>
            <span>Pin</span>
          </button>
        ) : manual ? (
          <button type="button" className="btn btn-sm" aria-label={`Claim (preview) ${collectible.name}`} onClick={onClaim}>
            Claim (preview)
          </button>
        ) : null}
      </div>
    </article>
  );
}
