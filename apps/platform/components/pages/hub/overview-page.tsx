"use client";

import Link from "next/link";
import { useRef } from "react";
import { landingHref } from "../../../lib/landing";
import { useNotifications } from "../../../lib/notifications";
import { useOre } from "../../../lib/ore-ledger";
import { PixelIcon } from "../../shell/icons";
import { NAV_GROUPS } from "../../shell/nav-data";
import { EmptyState, Meter, PageHeader, Panel, PreviewNote, Stat, StatGrid, Status, Tag } from "../../ui/ui";
import { navLead } from "./data";
import { deriveNextActions, mergeActivity, onboardingItems, onboardingProgress, SOURCE_LABEL } from "./logic/overview";
import { formatDayUtc, plural } from "./logic/text";
import { PreviewTools, useAnnounce } from "./shared";
import { useHub, useOnboarding, useProfile, useUnread } from "./state";

// Overview: the home of the platform. Every number comes from the same saved preview state as the tab it
// belongs to (through that tab's summary hook), so this page can never disagree with them.

export function OverviewPage() {
  const hub = useHub();
  const { build, community, seasons, gear } = hub;
  const ore = useOre();
  const { items: notifications } = useNotifications();
  const unread = useUnread();
  const { profile } = useProfile();
  const onboarding = useOnboarding();
  const [message, announce] = useAnnounce();
  const numbersRef = useRef<HTMLDivElement>(null);

  const steps = onboardingItems(build, gear);
  const progress = onboardingProgress(steps);
  const actions = deriveNextActions({ build, community, seasons, gear, unread, bioEmpty: profile.bio.trim() === "" });
  const activity = mergeActivity({ ledger: ore.entries, community: community.recentActivity, notifications });

  function hideChecklist() {
    onboarding.setDismissed(true);
    announce("Getting-started checklist hidden. You can show it again under Preview tools.");
    numbersRef.current?.focus();
  }

  return (
    <>
      <PageHeader eyebrow="Build" title="Overview" lead={navLead("overview")} />
      <PreviewNote />

      <div className="pg-stack">
        {!onboarding.dismissed ? (
          <Panel
            title="Getting started"
            actions={
              <button type="button" className="btn btn-quiet btn-sm" onClick={hideChecklist}>
                {progress.complete ? "Hide checklist" : "Dismiss checklist"}
              </button>
            }
          >
            <p className="mut">
              {progress.complete ? "You have done all four. Hide this checklist whenever you like." : "Four first steps. Each one ticks itself when you do it."}{" "}
              {progress.done} of {progress.total} done.
            </p>
            <Meter value={progress.done} max={progress.total} label="Getting started progress" />
            <ol className="hb-steps">
              {steps.map((step) => (
                <li key={step.id} className="hb-step" data-done={step.done}>
                  <Tag tone={step.done ? "ok" : "plain"}>{step.done ? "Done" : "To do"}</Tag>
                  <Link href={step.href}>{step.label}</Link>
                </li>
              ))}
            </ol>
          </Panel>
        ) : null}

        <div ref={numbersRef} tabIndex={-1} role="group" aria-label="Your numbers" className="hb-focus-target">
          <StatGrid>
            <Stat label="Ore" value={ore.balance.toLocaleString("en-GB")} hint={`${gear.oreEarned.toLocaleString("en-GB")} earned, ${gear.oreSpent.toLocaleString("en-GB")} spent`} />
            <Stat label="Approved ships" value={build.approvedShips} hint={`${build.projects.length} ${build.projects.length === 1 ? "project" : "projects"}`} />
            <Stat label="Journal entries" value={build.journalEntries} hint={`${build.hoursLogged} h logged`} />
            <Stat label="Reviews done" value={build.reviewsDone} hint={`${build.reviewsOwed} owed before payout`} />
            <Stat label="Streak" value={seasons.streakWeeks} hint={seasons.streakWeeks === 1 ? "week" : "weeks"} />
            <Stat label="Wishlist" value={gear.wishlistCount} hint={`${gear.wishlistAffordable} you can afford now`} />
            <Stat label="Open orders" value={gear.ordersOpen} hint={`${gear.ordersTotal} in total`} />
            <Stat label="Achievements" value={`${hub.earnedCount} of ${hub.rows.length}`} hint="Earned so far" />
          </StatGrid>
        </div>
        <Status message={message} />

        <div className="pg-cols">
          <Panel title="Next actions">
            {actions.length === 0 ? (
              <EmptyState title="Nothing waiting for you">Journals are up to date and no ships, requests or orders need you right now.</EmptyState>
            ) : (
              <ul className="row-list">
                {actions.map((action) => (
                  <li key={action.label} className="row-item">
                    <span>{action.label}</span>
                    <Link href={action.href} className="btn btn-quiet btn-sm">
                      Open
                      <span className="sr-only">: {action.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Season and Era">
            <div className="hb-progress">
              <p>
                <strong>{seasons.seasonName}</strong> <span className="mut">Season, {seasons.seasonProgressPct}% of the way through</span>
              </p>
              <Meter value={seasons.seasonProgressPct} max={100} label={`${seasons.seasonName} Season progress`} />
            </div>
            <div className="hb-progress">
              <p>
                <strong>{seasons.eraName}</strong> <span className="mut">Era, {seasons.eraProgressPct}% of the Draft threshold</span>
              </p>
              <Meter value={seasons.eraProgressPct} max={100} label={`${seasons.eraName} Era progress`} />
            </div>
            <p className="mut">
              Season dates and the Era threshold are placeholders on a preview calendar. {seasons.questsDone} of {seasons.questsTotal} Season quests done.
            </p>
            <Link href="/seasons" className="btn btn-quiet btn-sm">
              Open Seasons
            </Link>
          </Panel>
        </div>

        <Panel title="Recent activity">
          {activity.length === 0 ? (
            <EmptyState title="No activity yet">Earn Ore, post to the community or get a notification and it shows up here.</EmptyState>
          ) : (
            <ul className="row-list">
              {activity.map((item) => (
                <li key={item.id} className="row-item">
                  <span className="hb-activity">
                    <Tag>{SOURCE_LABEL[item.source]}</Tag>{" "}
                    {item.href ? <Link href={item.href}>{item.text}</Link> : <span>{item.text}</span>}
                  </span>
                  <time className="mut" dateTime={item.at}>
                    {formatDayUtc(item.at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
          <p className="mut hb-note">Showing the latest {plural(activity.length, "item")}. Dates are in UTC.</p>
        </Panel>

        <Panel title="Where everything lives">
          <div className="map-groups hb-map">
            {NAV_GROUPS.map((group) => (
              <section key={group.label} className="map-group" aria-label={group.label}>
                <h3>{group.label}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.slug}>
                      <div className="map-link">
                        <PixelIcon name={item.slug} className="hb-map-icon" />
                        {item.external ? (
                          <a href={landingHref(`/${item.slug}`)}>
                            {item.label}
                            <span className="sr-only"> (public Docs, leaves the platform)</span>
                          </a>
                        ) : (
                          <Link href={`/${item.slug}`}>{item.label}</Link>
                        )}
                      </div>
                      <p>{item.purpose}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Panel>

        {onboarding.dismissed ? (
          <PreviewTools hint="Bring the first-run checklist back.">
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={() => {
                onboarding.setDismissed(false);
                announce("Getting-started checklist shown.");
              }}
            >
              Show the getting-started checklist
            </button>
          </PreviewTools>
        ) : null}
      </div>
    </>
  );
}
