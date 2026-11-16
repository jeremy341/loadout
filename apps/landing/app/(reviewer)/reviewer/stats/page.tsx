/* eslint-disable @next/next/no-img-element */
import { requirePage } from "@/reviewer-dash/lib/guard";
import { publicStats, publicGallery } from "@/reviewer-dash/lib/db";
import { GrowthChart } from "@/reviewer-dash/app/_components/GrowthChart";
import { Card, Icon, Stat, StatGrid } from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stats",
  description: "Approved projects, hours and Ore across LOADOUT builders.",
};

export default async function StatsPage() {
  // Pixl serves this page to everyone; here it is the owner's (the reviewer site is closed to anyone without a role).
  await requirePage("owner");
  const [stats, gallery] = await Promise.all([publicStats(30), publicGallery(12)]);
  const n = (v: number) => v.toLocaleString("en-US");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <span className="hc-title inline-block" style={{ color: "var(--primary)" }}>
          LOADOUT
        </span>
        <h1 className="hc-heading mt-2 text-xl">Stats</h1>
        <p className="hc-caption mt-1">Teenagers building real tools, systems, compute and hardware, earning Ore for approved hours.</p>
      </header>

      <StatGrid>
        <Stat label="Builders" value={n(stats.builders)} icon="people-3" />
        <Stat label="Projects approved" value={n(stats.approvedProjects)} icon="check-circle" tone="success" />
        <Stat label="In review right now" value={n(stats.inReview)} icon="view" tone="warning" />
        <Stat label="Hours of making" value={n(stats.totalHours)} icon="clock" />
        <Stat label="Ore earned" value={n(stats.oreEarned)} icon="grid" tone="info" />
        <Stat label="Reviews done" value={n(stats.reviews)} icon="checkmark-all" />
      </StatGrid>

      <Card>
        <GrowthChart
          title="Ships per day (last 30 days)"
          series="projects"
          kind="daily"
          points={stats.shipsSeries}
        />
      </Card>

      {gallery.length > 0 && (
        <section>
          <h2 className="hc-heading mb-4 text-base">Recently approved</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((p) => (
              <div key={p.id} className="hc-card block overflow-hidden" data-density="flush">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="h-36 w-full object-cover" />
                ) : (
                  <div className="hc-muted grid h-36 w-full place-items-center" style={{ background: "var(--sunken)" }}>
                    <Icon glyph="photo" size={40} />
                  </div>
                )}
                <div className="p-3">
                  <div className="truncate font-bold">{p.name}</div>
                  <div className="truncate text-xs hc-muted">
                    by {p.owner}
                    {p.approved_hours != null ? `, ${p.approved_hours}h` : ""}
                  </div>
                  {p.description && <div className="mt-1 line-clamp-2 text-xs hc-muted">{p.description}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
