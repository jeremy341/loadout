import { describe, expect, test } from "bun:test";
import { TRACKS } from "@/lib/platform/progress";
import { approvedMinutes, REVIEWERS, REVIEW_SHIPS } from "@/lib/platform/review";
import { STAFF_ROLES } from "@/lib/reviewer/access";
import {
  activityLabel,
  approvedTotal,
  daysAgoLabel,
  filterPlayers,
  filterProjects,
  hasModeration,
  accessFor,
  grantsOf,
  hoursLabel,
  markerEffects,
  markerWords,
  memberFor,
  isOwnerMember,
  isTeamMember,
  journaledOf,
  PLAYERS_PAGE_SIZE,
  PROJECTS_PAGE_SIZE,
  REVIEWERS_PAGE_SIZE,
  activeBanFor,
  auditFlags,
  auditsBy,
  canUndo,
  describeTeamChange,
  isFinalReviewer,
  parseReviewersQuery,
  queueScopeOf,
  reviewerEntries,
  reviewerEntry,
  reviewersHref,
  reviewersView,
  reviewDuration,
  reviewerTotals,
  statsFor,
  TEAM_LOG,
  visibleProjects,
  dateDaysAgo,
  missionTitle,
  parsePlayersQuery,
  parseProjectsQuery,
  plural,
  PLAYERS,
  playerById,
  playerProjects,
  playerShips,
  playersHref,
  playersView,
  projectById,
  projectForShip,
  projectsHref,
  projectsView,
  reviewHistory,
  roleCounts,
  roleGuide,
  roleWords,
  rolesOf,
  sortPlayers,
  sortProjects,
  STAFF_PROJECTS,
  TEAM,
  teamMembers,
  STAGE_FOR_STATUS,
  trackHoursList,
  type PlayersQuery,
  type ProjectsQuery,
} from "./people";

const playersQuery = (over: Partial<PlayersQuery> = {}): PlayersQuery => ({ q: "", track: null, status: null, sort: "active", page: 1, ...over });
const projectsQuery = (over: Partial<ProjectsQuery> = {}): ProjectsQuery => ({ q: "", view: "active", kind: null, stage: null, track: null, sort: "created", page: 1, ...over });

describe("players query", () => {
  test("an empty address is the default view", () => {
    expect(parsePlayersQuery({})).toEqual(playersQuery());
    expect(playersHref(playersQuery())).toBe("/players");
  });

  test("unknown values fall back, known values are read case-insensitively", () => {
    const query = parsePlayersQuery({ q: "  kes ", track: "HARDWARE", status: "Banned", sort: "nonsense", page: "-3" });
    expect(query).toEqual(playersQuery({ q: "kes", track: "Hardware", status: "banned", page: 1 }));
    expect(parsePlayersQuery({ track: "plumbing", status: "gone" })).toEqual(playersQuery());
  });

  test("the first of a repeated parameter wins and the search text is capped", () => {
    expect(parsePlayersQuery({ status: ["warned", "banned"] }).status).toBe("warned");
    expect(parsePlayersQuery({ q: "x".repeat(500) }).q).toHaveLength(80);
  });

  test("the address round-trips", () => {
    const query = playersQuery({ q: "wick", track: "Tools", status: "active", sort: "hours", page: 2 });
    const href = playersHref(query);
    expect(href).toBe("/players?q=wick&track=tools&status=active&sort=hours&page=2");
    const params = Object.fromEntries(new URL(href, "http://x").searchParams);
    expect(parsePlayersQuery(params)).toEqual(query);
  });
});

describe("players list", () => {
  test("search matches part of a handle, ignoring case", () => {
    expect(filterPlayers(PLAYERS, playersQuery({ q: "KEST" })).map((item) => item.handle)).toEqual(["kestrel42"]);
    expect(filterPlayers(PLAYERS, playersQuery({ q: "zzzz" }))).toEqual([]);
  });

  test("the track filter keeps players with approved hours in that track", () => {
    const rows = filterPlayers(PLAYERS, playersQuery({ track: "Compute" }));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((item) => item.approved.Compute > 0)).toBe(true);
  });

  test("the status filter and the search combine", () => {
    const banned = filterPlayers(PLAYERS, playersQuery({ status: "banned" }));
    expect(banned.map((item) => item.handle).sort()).toEqual(["nib", "ostler"]);
    expect(filterPlayers(PLAYERS, playersQuery({ status: "banned", q: "kestrel" }))).toEqual([]);
  });

  test("sorting is stable and falls back to the handle", () => {
    const byActive = sortPlayers(PLAYERS, "active");
    expect(byActive[0].lastActiveHoursAgo).toBeLessThanOrEqual(byActive[1].lastActiveHoursAgo);
    const byHours = sortPlayers(PLAYERS, "hours");
    expect(approvedTotal(byHours[0])).toBeGreaterThanOrEqual(approvedTotal(byHours[1]));
    const byName = sortPlayers(PLAYERS, "name").map((item) => item.handle);
    expect(byName).toEqual([...byName].sort((a, b) => a.localeCompare(b)));
    expect(sortPlayers(PLAYERS, "hours").map((item) => item.id)).toEqual(sortPlayers([...PLAYERS].reverse(), "hours").map((item) => item.id));
  });

  test("pages hold 25 and the last page is clamped", () => {
    const first = playersView(PLAYERS, playersQuery());
    expect(first.items).toHaveLength(PLAYERS_PAGE_SIZE);
    expect(first.total).toBe(PLAYERS.length);
    const beyond = playersView(PLAYERS, playersQuery({ page: 99 }));
    expect(beyond.page).toBe(beyond.pages);
    expect(beyond.items.length).toBeGreaterThan(0);
  });

  test("lookups use the lower-case handle", () => {
    expect(playerById("Kestrel42")?.handle).toBe("kestrel42");
    expect(playerById("marlin_k")?.handle).toBe("marlin_k");
    expect(playerById("nobody")).toBeNull();
  });

  test("track hours list leaves out empty tracks and puts the biggest first", () => {
    const item = playerById("tinwren");
    expect(item).not.toBeNull();
    expect(trackHoursList(item!).map((entry) => entry.track)).toEqual(["Tools", "Hardware", "Systems"]);
    expect(trackHoursList(playerById("softlaunch")!)).toEqual([]);
  });

  test("moderation shows for warned, banned or counted players only", () => {
    expect(hasModeration(playerById("kestrel42")!)).toBe(false);
    expect(hasModeration(playerById("wick")!)).toBe(true);
    expect(hasModeration(playerById("ostler")!)).toBe(true);
  });
});

describe("players fixtures", () => {
  test("handles are unique and every ship builder is a player", () => {
    expect(new Set(PLAYERS.map((item) => item.id)).size).toBe(PLAYERS.length);
    for (const ship of REVIEW_SHIPS) expect(playerById(ship.builder)).not.toBeNull();
  });

  test("a banned player has a ban, and counts are never negative", () => {
    for (const item of PLAYERS) {
      expect(item.violations).toBeGreaterThanOrEqual(0);
      expect(item.bans).toBeGreaterThanOrEqual(0);
      if (item.standing === "banned") expect(item.bans).toBeGreaterThan(0);
    }
  });

  test("approved hours cover the approved time on a builder's accepted ships", () => {
    for (const ship of REVIEW_SHIPS) {
      const allocation = ship.decision?.allocation;
      const minutes = approvedMinutes(ship);
      if (!allocation || minutes === null) continue;
      const owner = playerById(ship.builder)!;
      for (const track of TRACKS) {
        expect(owner.approved[track]).toBeGreaterThanOrEqual(Math.floor((minutes / 60) * (allocation[track] / 100)));
      }
    }
  });

  test("ships and review history belong to the player", () => {
    const owner = playerById("cairn")!;
    expect(playerShips(owner).map((ship) => ship.id)).toEqual(["sh-2051"]);
    expect(reviewHistory(owner).map((ship) => ship.id)).toEqual(["sh-2051"]);
    expect(reviewHistory(playerById("kestrel42")!)).toEqual([]);
  });
});

describe("projects query", () => {
  test("an empty address is the default view", () => {
    expect(parseProjectsQuery({})).toEqual(projectsQuery());
    expect(projectsHref(projectsQuery())).toBe("/projects");
  });

  test("unknown values fall back", () => {
    expect(parseProjectsQuery({ kind: "mechanical", stage: "done", track: "x", sort: "newest", page: "abc", view: "everything" })).toEqual(projectsQuery());
  });

  test("the address round-trips", () => {
    const query = projectsQuery({ q: "board", view: "archived", kind: "hardware", stage: "in_review", track: "Hardware", sort: "title", page: 2 });
    const href = projectsHref(query);
    expect(href).toBe("/projects?q=board&view=archived&kind=hardware&stage=in_review&track=hardware&sort=title&page=2");
    expect(parseProjectsQuery(Object.fromEntries(new URL(href, "http://x").searchParams))).toEqual(query);
  });
});

describe("projects list", () => {
  test("search matches the title or the owner", () => {
    expect(filterProjects(STAFF_PROJECTS, projectsQuery({ q: "netcode" })).map((item) => item.owner)).toEqual(["kestrel42"]);
    expect(filterProjects(STAFF_PROJECTS, projectsQuery({ q: "KILN" })).map((item) => item.owner)).toEqual(["brasskettle"]);
    expect(filterProjects(STAFF_PROJECTS, projectsQuery({ q: "cobble" })).map((item) => item.owner)).toEqual(["cobble"]);
  });

  test("kind, stage and track narrow the list together", () => {
    const rows = filterProjects(STAFF_PROJECTS, projectsQuery({ kind: "hardware", stage: "logging", track: "Hardware" }));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((item) => item.kind === "hardware" && item.stage === "logging" && item.track === "Hardware")).toBe(true);
  });

  test("sorting by hours puts the longest log first and ties fall back to the title", () => {
    const rows = sortProjects(STAFF_PROJECTS, "hours");
    expect(rows[0].loggedMinutes).toBeGreaterThanOrEqual(rows[1].loggedMinutes);
    const titles = sortProjects(STAFF_PROJECTS, "title").map((item) => item.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
    expect(sortProjects(STAFF_PROJECTS, "recent").map((item) => item.id)).toEqual(sortProjects([...STAFF_PROJECTS].reverse(), "recent").map((item) => item.id));
  });

  test("pages hold 20", () => {
    expect(projectsView(STAFF_PROJECTS, projectsQuery()).items).toHaveLength(PROJECTS_PAGE_SIZE);
    expect(projectsView(STAFF_PROJECTS, projectsQuery({ page: 50 })).page).toBeGreaterThan(1);
  });
});

describe("projects fixtures", () => {
  test("ids are unique and every owner is a player", () => {
    expect(new Set(STAFF_PROJECTS.map((item) => item.id)).size).toBe(STAFF_PROJECTS.length);
    for (const item of STAFF_PROJECTS) expect(playerById(item.owner)).not.toBeNull();
  });

  test("every ship in the review sample has one project, with the matching stage", () => {
    for (const ship of REVIEW_SHIPS) {
      const found = projectForShip(ship.id);
      expect(found).not.toBeNull();
      expect(found!.stage).toBe(STAGE_FOR_STATUS[ship.status]);
      expect(found!.owner).toBe(ship.builder);
    }
  });

  test("journaled time never passes logged time, and approved time never passes journaled", () => {
    for (const item of STAFF_PROJECTS) {
      expect(journaledOf(item)).toBeLessThanOrEqual(item.loggedMinutes);
      if (item.approvedMinutes !== null) expect(item.approvedMinutes).toBeLessThanOrEqual(journaledOf(item));
    }
  });

  test("only an approved project is published, and unfinished ones have no ship", () => {
    for (const item of STAFF_PROJECTS) {
      if (item.published) expect(item.stage).toBe("approved");
      if (item.stage === "draft" || item.stage === "logging") expect(item.shipId).toBeNull();
    }
  });

  test("a player's projects are the ones they own", () => {
    expect(playerProjects(playerById("tinwren")!).map((item) => item.id)).toEqual(["pr-3001"]);
    expect(projectById("PR-2041")?.title).toBe("Rollback netcode library");
    expect(projectById("pr-0")).toBeNull();
  });
});

describe("team and roles", () => {
  test("the team is owners first, then A to Z inside each kind", () => {
    const rows = teamMembers();
    expect(rows.slice(0, 2).map((item) => item.handle)).toEqual(["ironlark", "tolliver"]);
    const reviewers = rows.filter((item) => item.roles[0] === "reviewer").map((item) => item.handle);
    expect(reviewers).toEqual([...reviewers].sort());
    expect(new Set(TEAM.map((item) => item.handle)).size).toBe(TEAM.length);
  });

  test("every reviewer on the review roster is on the team with the markers their queue access implies", () => {
    for (const reviewer of REVIEWERS) {
      const member = memberFor(reviewer.handle);
      expect(member?.roles).toContain("reviewer");
      expect(member?.markers.includes("second_pass")).toBe(reviewer.secondPass);
      expect(member?.markers.includes("reviewer_hardware_only")).toBe(reviewer.access === "hardware");
      expect(member?.markers.includes("reviewer_software_only")).toBe(reviewer.access === "software");
    }
  });

  test("owners come from the environment: no grant, no date, and no database value makes one", () => {
    for (const member of TEAM.filter(isOwnerMember)) {
      expect(member.sinceDaysAgo).toBeNull();
      expect(grantsOf(member)).not.toContain("owner");
      expect(accessFor(member)?.isOwner).toBe(true);
    }
    for (const member of TEAM.filter((item) => !isOwnerMember(item))) {
      expect(member.sinceDaysAgo).not.toBeNull();
      expect(accessFor(member)?.isOwner).toBe(false);
    }
  });

  test("the real gating agrees with the sample: every member has access, reviewers keep their queue and second pass", () => {
    for (const member of TEAM) expect(accessFor(member)).not.toBeNull();
    for (const reviewer of REVIEWERS) {
      const access = accessFor(memberFor(reviewer.handle)!);
      expect(access?.canSecondPass).toBe(reviewer.secondPass);
      expect(access?.reviewQueues).toBe(reviewer.access === "both" ? "both" : reviewer.access);
    }
    expect(accessFor(memberFor("tolliver")!)?.isReviewer).toBe(false);
    expect(accessFor(memberFor("wick")!)).toMatchObject({ isHelper: true, isReviewer: false, isFulfiller: false });
  });

  test("every grant is a value the site reads", () => {
    for (const member of TEAM) for (const grant of grantsOf(member)) expect((STAFF_ROLES as readonly string[]).includes(grant)).toBe(true);
  });

  test("rolesOf and roleWords read the team", () => {
    expect(rolesOf("tamsin")).toEqual(["reviewer", "fulfiller"]);
    expect(rolesOf("kestrel42")).toEqual([]);
    expect(isTeamMember("tolliver")).toBe(true);
    expect(isTeamMember("kestrel42")).toBe(false);
    expect(roleWords([])).toBe("Builder");
    expect(roleWords(["reviewer", "fulfiller"])).toBe("Reviewer and Fulfiller");
  });

  test("markers read as words, and a reviewer without a queue marker takes both queues", () => {
    expect(markerWords(memberFor("bellwether")!)).toBe("Second pass, Both queues");
    expect(markerWords(memberFor("orrery")!)).toBe("Second pass, Hardware only");
    expect(markerWords(memberFor("tamsin")!)).toBe("Software only");
    expect(markerWords(memberFor("tolliver")!)).toBe("Not reviewing");
    expect(markerWords(memberFor("wick")!)).toBe("None");
  });

  test("role counts count a person under each role they hold", () => {
    const counts = roleCounts();
    expect(counts.owner).toBe(2);
    expect(counts.reviewer).toBe(REVIEWERS.length);
    expect(counts.fulfiller).toBe(3);
    expect(counts.helper).toBe(2);
  });

  test("the role guide is derived from the nav: an owner opens every group, the others only their own", () => {
    const guide = roleGuide();
    expect(guide.map((item) => item.role)).toEqual(["owner", "reviewer", "helper", "fulfiller"]);
    const byRole = Object.fromEntries(guide.map((item) => [item.role, item]));
    expect(byRole.owner.opens.map((item) => item.group)).toEqual(["Top bar", "Queues", "Shop and money", "Community", "Moderation", "Admin", "Review tabs"]);
    expect(byRole.owner.opens.every((item) => item.all)).toBe(true);
    expect(byRole.owner.home).toBe("/");
    expect(byRole.helper.opens).toEqual([{ group: "Top bar", tabs: ["Tickets"], all: false }]);
    expect(byRole.helper.home).toBe("/tickets");
    expect(byRole.fulfiller.opens).toEqual([{ group: "Top bar", tabs: ["Fulfilment"], all: false }]);
    expect(byRole.fulfiller.home).toBe("/fulfillment");
    const reviewerGroups = byRole.reviewer.opens.map((item) => item.group);
    expect(reviewerGroups).toContain("Review tabs");
    expect(reviewerGroups).not.toContain("Admin");
    expect(byRole.reviewer.opens.find((item) => item.group === "Review tabs")?.tabs).not.toContain("Second pass");
  });

  test("marker effects are derived from the same gating", () => {
    const effects = Object.fromEntries(markerEffects().map((item) => [item.marker, item]));
    expect(effects.second_pass.adds).toEqual(["Second pass"]);
    expect(effects.reviewer_hardware_only.removes).toEqual([]);
    expect(effects.reviewer_software_only.removes).toEqual(["Hardware"]);
    // An owner passes every gate, so the marker changes who may take ships, not which tabs open.
    expect(effects.no_review).toMatchObject({ adds: [], removes: [] });
  });
});

describe("words", () => {
  test("days and hours read plainly", () => {
    expect(daysAgoLabel(0)).toBe("today");
    expect(daysAgoLabel(12)).toBe("12d ago");
    expect(daysAgoLabel(90)).toBe("3 months ago");
    expect(activityLabel(0.5)).toBe("under 1h ago");
    expect(activityLabel(5)).toBe("5h ago");
    expect(activityLabel(96)).toBe("4d ago");
  });

  test("hours read with one decimal at most", () => {
    expect(hoursLabel(0)).toBe("0h");
    expect(hoursLabel(540)).toBe("9h");
    expect(hoursLabel(1890)).toBe("31.5h");
    expect(hoursLabel(-5)).toBe("0h");
  });

  test("plural adds an s only for counts other than one", () => {
    expect(plural(1, "ship")).toBe("1 ship");
    expect(plural(0, "ship")).toBe("0 ships");
    expect(plural(3, "order")).toBe("3 orders");
  });
});

describe("player standing is read from the moderation records", () => {
  test("a player with an active ban is banned, with a recorded violation is warned, otherwise OK", () => {
    expect(playerById("ostler")!.standing).toBe("banned");
    expect(playerById("quill")!.standing).toBe("warned");
    expect(playerById("kestrel42")!.standing).toBe("active");
    expect(activeBanFor("ostler")).not.toBeNull();
    expect(activeBanFor("quill")).toBeNull();
  });

  test("every sample order and ticket belongs to a player", async () => {
    const { FULFILMENT_ORDERS, TICKETS } = await import("./fulfilment");
    for (const order of FULFILMENT_ORDERS) expect(playerById(order.buyer)).not.toBeNull();
    for (const ticket of TICKETS) expect(playerById(ticket.builder)).not.toBeNull();
  });
});

describe("project archive and search", () => {
  test("owners see removed projects mixed in, reviewers only active ones, and the archive lists only removed ones", () => {
    const owner = visibleProjects(STAFF_PROJECTS, "active", true);
    const reviewer = visibleProjects(STAFF_PROJECTS, "active", false);
    const archive = visibleProjects(STAFF_PROJECTS, "archived", false);
    expect(owner).toHaveLength(STAFF_PROJECTS.length);
    expect(reviewer.every((item) => item.removal === null)).toBe(true);
    expect(archive.length).toBeGreaterThan(0);
    expect(archive.every((item) => item.removal !== null)).toBe(true);
    expect(reviewer.length + archive.length).toBe(STAFF_PROJECTS.length);
  });

  test("the search finds a project by its number, with or without a hash", () => {
    const found = filterProjects(STAFF_PROJECTS, projectsQuery({ q: "#3011" }));
    expect(found.map((item) => item.id)).toEqual(["pr-3011"]);
    expect(filterProjects(STAFF_PROJECTS, projectsQuery({ q: "3011" }))).toHaveLength(1);
  });

  test("removed projects keep who removed them and why", () => {
    for (const item of STAFF_PROJECTS.filter((entry) => entry.removal)) {
      expect(item.removal!.by.length).toBeGreaterThan(0);
      expect(item.removal!.reason.length).toBeGreaterThan(0);
    }
    expect(projectById("pr-3013")!.removal!.kind).toBe("banned");
    expect(projectById("pr-3012")!.removal!.kind).toBe("rejected");
  });

  test("the default order is newest first", () => {
    const rows = sortProjects(STAFF_PROJECTS, "created");
    expect(rows[0].createdHoursAgo).toBeLessThanOrEqual(rows[1].createdHoursAgo);
  });
});

describe("reviewers", () => {
  test("every sample reviewer is listed, and an owner who reviews is too, with zero numbers", () => {
    const entries = reviewerEntries();
    for (const reviewer of REVIEWERS) expect(entries.some((entry) => entry.handle === reviewer.handle)).toBe(true);
    const owner = reviewerEntry("ironlark")!;
    expect(owner.owner).toBe(true);
    expect(statsFor(owner).reviews).toBe(0);
    // An owner with Not reviewing is left out.
    expect(reviewerEntry("tolliver")).toBeNull();
    expect(reviewerEntry("nobody")).toBeNull();
  });

  test("totals add up the per-reviewer figures", () => {
    const totals = reviewerTotals();
    expect(totals.reviews).toBe(REVIEWERS.reduce((sum, item) => sum + item.allTime, 0));
  });

  test("queue scope and the final reviewer flag come from the markers", () => {
    expect(queueScopeOf(reviewerEntry("fenwick")!)).toBe("hardware");
    expect(queueScopeOf(reviewerEntry("tamsin")!)).toBe("software");
    expect(queueScopeOf(reviewerEntry("bellwether")!)).toBe("both");
    expect(isFinalReviewer(reviewerEntry("orrery")!)).toBe(true);
    expect(isFinalReviewer(reviewerEntry("lintel")!)).toBe(false);
  });

  test("the list searches by handle, pages by 15 and puts the busiest first", () => {
    expect(parseReviewersQuery({ q: " @ORR ", page: "0" })).toEqual({ q: "@ORR", page: 1 });
    const all = reviewersView(reviewerEntries(), { q: "", page: 1 });
    expect(all.items.length).toBeLessThanOrEqual(REVIEWERS_PAGE_SIZE);
    expect(statsFor(all.items[0]).reviews).toBeGreaterThanOrEqual(statsFor(all.items[1]).reviews);
    expect(reviewersView(reviewerEntries(), { q: "@orr", page: 1 }).items.map((entry) => entry.handle)).toEqual(["orrery"]);
    expect(reviewersHref({ q: "", page: 1 })).toBe("/reviewers");
    expect(reviewersHref({ q: "orr", page: 2 })).toBe("/reviewers?q=orr&page=2");
  });

  test("a review under a minute, or an approval with the source never opened, is flagged", () => {
    expect(auditFlags({ seconds: 40, verdict: "needs_changes", repoSeconds: 10 })).toEqual(["under a minute"]);
    expect(auditFlags({ seconds: 600, verdict: "approved", repoSeconds: null })).toEqual(["source never opened"]);
    expect(auditFlags({ seconds: 600, verdict: "needs_changes", repoSeconds: null })).toEqual([]);
    expect(auditFlags({ seconds: 0, verdict: "approved", repoSeconds: 20 })).toEqual([]);
  });

  test("audits belong to the reviewer and read newest first", () => {
    const rows = auditsBy("orrery");
    expect(rows.every((item) => item.reviewer === "orrery")).toBe(true);
    for (let i = 1; i < rows.length; i += 1) expect(rows[i].hoursAgo).toBeGreaterThanOrEqual(rows[i - 1].hoursAgo);
  });

  test("durations read plainly", () => {
    expect(reviewDuration(0)).toBe("-");
    expect(reviewDuration(45)).toBe("45s");
    expect(reviewDuration(125)).toBe("2m 05s");
    expect(reviewDuration(3780)).toBe("1h 03m");
  });
});

describe("team log", () => {
  test("describes every change, and only a change that is not an undo can be undone", () => {
    for (const entry of TEAM_LOG) expect(describeTeamChange(entry).length).toBeGreaterThan(0);
    expect(describeTeamChange({ action: "removed", before: ["fulfiller"], after: [] })).toBe("removed from the team (had fulfiller)");
    expect(describeTeamChange({ action: "added", before: [], after: ["helper"] })).toBe("added to the team as helper");
    expect(canUndo({ action: "undo" })).toBe(false);
    expect(canUndo({ action: "updated" })).toBe(true);
  });
});

describe("dates and missions", () => {
  test("dates are counted back from the sample day", () => {
    expect(dateDaysAgo(0)).toBe("6 Nov 2026");
    expect(dateDaysAgo(6)).toBe("31 Oct 2026");
    expect(missionTitle(null)).toBeNull();
    expect(missionTitle("nope")).toBeNull();
  });
});
