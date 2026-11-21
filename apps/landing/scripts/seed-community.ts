import { db } from "../lib/platform/db";
import { localTestAccountsEnabled } from "../lib/platform/local-accounts";

// Local development only, after `bun run db:seed:local` (and `bun run seed:local-explore` for the Explore side). Writes the
// rows the Community section reads: the community goals a staff member would configure (the current figures are examples,
// so the bars are visible in dev), a few programme notes by the local staff account, and two Show & Tell events — one
// upcoming, so the RSVP control has something to press, and one past. Idempotent: goals upsert by key, and a note or event
// that is already there (by title) is left alone.
if (!localTestAccountsEnabled()) {
  console.error("Set LOADOUT_LOCAL_TEST_ACCOUNTS=true (and not NODE_ENV=production) to seed local community data.");
  process.exit(1);
}

// The staff account the news rows belong to. Local dev has one from seed-local-accounts; without any person at all there is
// nothing to author news, and the script says so rather than inventing one.
const author = await db().person.findUnique({ where: { email: "staff@loadout.test" }, select: { id: true } });
if (!author) {
  console.error("No local staff account (staff@loadout.test). Run `bun run db:seed:local` first.");
  process.exit(1);
}

// Community goals. current is what staff wrote (nothing counts up on its own); the values are local-dev stand-ins.
const goals = [
  { key: "era-threshold", title: "Meet the Era threshold", body: "Approved hours from every builder count toward the Era. When the threshold is met at an eligible weekly reset, the next Era begins.", current: 1240, target: 2000, endsAt: new Date("2027-05-01T00:00:00.000Z") },
  { key: "all-four-tracks", title: "An approved project in every track", body: "Tools, Systems, Compute and Hardware each need at least one approved project in the current Era.", current: 3, target: 4, endsAt: null },
  { key: "show-and-tell-reach", title: "Builders who showed a project", body: "Counts builders who have presented in a Show & Tell session.", current: 14, target: 20, endsAt: null },
];
for (const goal of goals) {
  await db().communityGoal.upsert({
    where: { key: goal.key },
    create: { ...goal },
    update: { title: goal.title, body: goal.body, current: goal.current, target: goal.target, endsAt: goal.endsAt },
  });
}

// Programme notes, newest last, by the staff account. Plain rows: the audit trail is for real staff writes, not seeds.
const news = [
  { title: "How Community Eras are meant to work", body: "An Era is a shared stage. It advances only when the community threshold is met and a minimum length has passed. The values are still being decided.", minutes: 60 * 24 * 9 },
  { title: "Explore lists approved projects", body: "Approved projects can be searched by title or builder. Drafts and work in review stay private to their owner.", minutes: 60 * 24 * 4 },
  { title: "Review has no scores and no peer rating", body: "Approval is a written decision against Originality, Technical Depth, Execution and Documentation. Nothing is scored.", minutes: 60 * 8 },
];
let newsWritten = 0;
for (const item of news) {
  const existing = await db().news.findFirst({ where: { title: item.title }, select: { id: true } });
  if (existing) continue;
  await db().news.create({
    data: { title: item.title, body: item.body, authorId: author.id, publishedAt: new Date(Date.now() - item.minutes * 60_000) },
  });
  newsWritten += 1;
}

// Two events: the next Show & Tell (upcoming, so RSVP presses work and the live count has rows) and a past one.
const events = [
  { title: "Show and Tell", body: "Builders show what they made. Short demos, one after another.", startsInDays: 3, lastsHours: 2 },
  { title: "Tools that rescued a bad afternoon", body: "Small scripts written because something was annoying, and kept because they worked. This session has been and gone.", startsInDays: -10, lastsHours: 2 },
];
let eventsWritten = 0;
for (const event of events) {
  const existing = await db().event.findFirst({ where: { title: event.title }, select: { id: true } });
  if (existing) continue;
  await db().event.create({
    data: {
      title: event.title,
      body: event.body,
      kind: "show_and_tell",
      startsAt: new Date(Date.now() + event.startsInDays * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + (event.startsInDays * 24 + event.lastsHours) * 60 * 60 * 1000),
      createdById: author.id,
    },
  });
  eventsWritten += 1;
}

// A few RSVPs from the sample builders on the upcoming event, so the live count is not zero in dev.
const upcoming = await db().event.findFirst({ where: { title: "Show and Tell", stoppedAt: null, startsAt: { gt: new Date() } }, select: { id: true } });
const locals = await db().person.findMany({ where: { email: { in: ["juniper@loadout.test", "kestrel@loadout.test"] } }, select: { id: true } });
let rsvpsWritten = 0;
if (upcoming && locals.length > 0) {
  for (const person of locals) {
    const existing = await db().eventRsvp.findUnique({ where: { eventId_personId: { eventId: upcoming.id, personId: person.id } }, select: { id: true } });
    if (existing) continue;
    await db().eventRsvp.create({ data: { eventId: upcoming.id, personId: person.id } });
    rsvpsWritten += 1;
  }
}

console.log(`Seeded ${goals.length} community goals, ${newsWritten} news notes, ${eventsWritten} events and ${rsvpsWritten} RSVPs.`);
await db().$disconnect();
