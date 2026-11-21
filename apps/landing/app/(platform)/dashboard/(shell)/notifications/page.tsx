import type { Metadata } from "next";
import { NotificationPrefs } from "@/app/_components/platform/NotificationPrefs";
import { NotificationsList } from "@/app/_components/platform/NotificationsList";
import { ScrambleText } from "@/app/_components/platform/ScrambleText";
import { getPrefs, listNotifications } from "@/lib/platform/notifications-data";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Notifications - LOADOUT" };

// Newest first, twenty at a time. A row never names a sender; it says what happened and links to where.
export default async function NotificationsPage() {
  const viewer = await requireViewer();
  const [page, prefs] = await Promise.all([listNotifications(viewer.id), getPrefs(viewer.id)]);
  const items = page.items.map((row) => ({ id: row.id, title: row.title, body: row.body, href: row.href, read: row.read, createdAt: row.createdAt.toISOString() }));

  return (
    <div className="pf-nt">
      <header className="pf-nt-head">
        <h1><ScrambleText text="Notifications" /></h1>
      </header>
      <NotificationsList initialItems={items} initialCursor={page.nextCursor} />
      <NotificationPrefs initial={prefs} />
    </div>
  );
}
