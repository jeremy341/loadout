import type { Metadata } from "next";
import { FlagForm } from "@/app/_components/platform/forms";
import { db } from "@/lib/platform/db";
import { KNOWN_FLAGS, type FlagName } from "@/lib/platform/flags";
import { requireStaff } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Feature flags - LOADOUT" };

export default async function FlagsPage() {
  await requireStaff();
  const names = Object.keys(KNOWN_FLAGS) as FlagName[];
  const rows = await db().featureFlag.findMany({ where: { name: { in: names } } });
  const enabledByName = new Map(rows.map((row) => [row.name, row.enabled]));

  return (
    <>
      <h1>Feature flags</h1>
      <p className="pf-lead">
        Flags hold features back until they are ready. A flag that has never been set is off. Each change needs a reason.
      </p>
      {names.map((name) => {
        const enabled = enabledByName.get(name) ?? false;
        return (
          <section className="pf-section" aria-labelledby={`flag-${name}`} key={name}>
            <h2 id={`flag-${name}`}>{KNOWN_FLAGS[name]}</h2>
            <p>
              <code>{name}</code> is <strong>{enabled ? "on" : "off"}</strong>.
            </p>
            <FlagForm name={name} enabled={enabled} />
          </section>
        );
      })}
    </>
  );
}
