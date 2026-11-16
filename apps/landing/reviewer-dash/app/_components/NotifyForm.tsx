"use client";

import { useEffect, useRef, useState } from "react";
import { sendNotification, searchPlayers, type PlayerHit } from "@/reviewer-dash/app/actions";
import { ActionButton, Card, CardHeader, Field, Input, Muted, Textarea } from "@/reviewer-dash/app/_ui/ui";

export function NotifyForm() {
  const [everyone, setEveryone] = useState(true);
  const [player, setPlayer] = useState("");
  const [selected, setSelected] = useState<PlayerHit | null>(null);
  const [hits, setHits] = useState<PlayerHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && player === selected.name) {
      setOpen(false);
      return;
    }
    const q = player.trim();
    if (q.length < 2) {
      setHits([]);
      setOpen(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    setOpen(true);
    const t = setTimeout(async () => {
      try {
        setHits(await searchPlayers(q));
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [player, selected]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const pick = (hit: PlayerHit) => {
    setSelected(hit);
    setPlayer(hit.name);
    setOpen(false);
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <form action={sendNotification} className="flex flex-col gap-4">
          <input type="hidden" name="backTo" value="/notify" />

          <div className="flex flex-col gap-2">
            <span className="hc-label">Audience</span>
            <div className="hc-segmented w-fit" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={everyone}
                className="hc-segmented-item px-3"
                onClick={() => setEveryone(true)}
              >
                Everyone
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!everyone}
                className="hc-segmented-item px-3"
                onClick={() => setEveryone(false)}
              >
                One builder
              </button>
            </div>
          </div>

          {!everyone && (
            <div ref={boxRef}>
              <Field
                label="Builder"
                hint={selected ? `Selected ${selected.name}` : "Pick a builder from the list, no need to type the exact handle."}
              >
                <div className="relative">
                  {selected && <input type="hidden" name="userId" value={selected.id} />}
                  <Input
                    name="playerName"
                    autoComplete="off"
                    value={player}
                    onChange={(e) => {
                      setPlayer(e.target.value);
                      setSelected(null);
                    }}
                    onFocus={() => hits.length > 0 && setOpen(true)}
                    placeholder="Search by handle"
                    required={!everyone}
                    className="w-full"
                  />
                  {open && (
                    <div className="hc-select-menu">
                      {searching && hits.length === 0 && (
                        <div className="px-3 py-2 text-sm">
                          <Muted>Searching...</Muted>
                        </div>
                      )}
                      {hits.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => pick(h)}
                          className="hc-select-option flex w-full items-center gap-2 text-left"
                        >
                          <span className="truncate font-bold">{h.name}</span>
                        </button>
                      ))}
                      {!searching && hits.length === 0 && (
                        <div className="px-3 py-2 text-sm">
                          <Muted>No builders found.</Muted>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Field>
            </div>
          )}

          <Field label="Title" hint={`${title.length}/100`}>
            <Input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
              placeholder="e.g. Show and Tell starts Friday"
              className="w-full"
            />
          </Field>

          <Field label="Message" hint={`${body.length}/500`}>
            <Textarea
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={5}
              required
              placeholder="Write your message"
              className="w-full resize-y"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <ActionButton icon="send-fill" pendingLabel="Sending...">
              {everyone ? "Send to everyone" : "Send"}
            </ActionButton>
            <Muted className="text-xs">
              {everyone ? "Goes to every builder's notifications." : "Goes to one builder's notifications."}
            </Muted>
          </div>
        </form>
      </Card>

      <div className="lg:sticky lg:top-24">
        <Card>
          <CardHeader title="Preview" icon="view" />
          <Card sunken padding="compact">
            <div className="mb-2 flex items-center gap-2">
              <Muted className="text-xs">LOADOUT notification</Muted>
            </div>
            <div className="text-sm font-bold break-words">{title || "Title"}</div>
            <div className="mt-1 text-sm break-words whitespace-pre-wrap">
              {body || <Muted>Your message will appear here.</Muted>}
            </div>
            <Muted className="mt-3 block text-xs">{everyone ? "To: everyone" : `To: ${player || "..."}`}</Muted>
          </Card>
        </Card>
      </div>
    </div>
  );
}
