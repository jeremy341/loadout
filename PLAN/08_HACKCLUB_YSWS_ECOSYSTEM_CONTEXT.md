# 08 Hack Club / YSWS Ecosystem Context

> This file provides current Hack Club / YSWS ecosystem context for implementation. It does not override LOADOUT plans 00–07. When this file conflicts with a canonical LOADOUT product decision, 00–07 win unless the human explicitly changes the plan.

## 0. Scope + research date

**Research date: 2026-10-04.** Public pages and repositories below were accessed on this date. Program dates, inventory, rules, and service capabilities can change; verify them again before publishing participant-facing claims.

This is a research brief, not a LOADOUT product-plan revision. Plans `00–07` were read first and remain authoritative. LOADOUT remains the technical-capability YSWS defined by those plans: Tools, Systems, Compute, Hardware; Research Mode; a permanent Digital Loadout; global Bolts; reviewer-assigned track XP; field-aware rewards; capped discounts; Requisitions; and its own **Industrial Field Manual + Pixel Utility** identity.

Significant claims use these labels:

- **OFFICIAL / FIRST-PARTY** — Hack Club documentation or an official program site.
- **SOURCE-CODE OBSERVATION** — a public repository, source tree, or repository-maintained implementation document.
- **PROGRAM EXAMPLE** — a rule or design choice belonging to a named YSWS only.
- **INFERENCE** — an interpretation of the public evidence, not Hack Club policy.
- **LOADOUT RECOMMENDATION** — a suggested response for LOADOUT, subordinate to plans `00–07`.
- **UNVERIFIED** — public evidence was insufficient or inaccessible.

**Research limits.** The organizer Canvas linked from the public YSWS guide redirects to a Hack Club Slack sign-in page; its contents were not accessible here. The requested `EDRipper/ysws-template` GitHub repository and raw README could not be fetched through public GitHub access in this run. That does not establish whether the repository is private, moved, or temporarily inaccessible. No private Slack content has been inferred. See sections 6, 11, 16, and 17.

## 1. Executive summary

1. **OFFICIAL / FIRST-PARTY:** YSWS is a family of teen-oriented programs built around practicing by making and shipping real projects, with rewards used as an incentive and as equipment for further building. The official guide explicitly distinguishes building/debugging from learning-only time.
2. **OFFICIAL / FIRST-PARTY:** The public YSWS guide names three universal time rules: do not inflate hours, do not submit the same project time to multiple YSWS programs, and do not submit Hackatime time accrued before a program starts. Program-specific rules still govern theme, submission, reward, and eligibility details.
3. **INFERENCE:** There is no single YSWS participant workflow, reward formula, review rubric, or technical stack. Programs range from broad build-anything shops to narrow framework challenges, hardware kits, grants, and event invitations.
4. **OFFICIAL / FIRST-PARTY:** Hackatime records coding-activity metadata through editor heartbeats; ordinary heartbeats do not include source contents or screenshots. Lapse is a separate time-lapse tool with encrypted media. Lookout is another, program-integrated screenshot-evidence service. None of these facts makes raw tracked time equivalent to valid, attributable project work.
5. **PROGRAM EXAMPLE:** Public review models include a staged functional/rules/fraud review (the general guide), peer ratings in broad programs such as Stardance/Flavortown, and hardware pitch → approval → devlog → ship flows in Forge. Partial awards, appeals, team splits, and AI policies are not universal in the sources reviewed.
6. **PROGRAM EXAMPLE:** Rewards include fixed parts kits, physical shops funded by virtual currencies, tiered hardware grants, restricted virtual card grants, reimbursements, credits, and event support. HCB is one possible financial instrument, not a required YSWS integration.
7. **SOURCE-CODE OBSERVATION:** Pixl, Forge, Flavortown, Hackpad, Lapse, and the YSWS Catalog show markedly different architectures. Reuse should be feature-by-feature and licensing-aware; a YSWS “template” should not be presumed to be the ecosystem standard.
8. **LOADOUT RECOMMENDATION:** Keep LOADOUT’s narrow technical-fit gate, journals and unique-minute assignments, reviewer-controlled XP split, and equipment-focused shop. Explain that these are LOADOUT rules and avoid presenting them as universal Hack Club policy.
9. **UNVERIFIED:** The private organizer proposal process (`#ysws-drafts` and the linked Slack Canvas), LOADOUT’s official-program status, and direct permission to use Hack Club eligibility/tracking data or HCB processes need confirmation from Hack Club.

## 2. What a YSWS is

### Meaning and purpose

**OFFICIAL / FIRST-PARTY:** YSWS means **“You Ship, We Ship.”** Hack Club’s public guide describes YSWS events as a family of programs run by teens to encourage teens to learn and build by offering rewards. Its stated learning philosophy is that participants practice through building and debugging; reading documentation or watching a video can prepare someone to build, but that time is not itself project-building time. Hack Club’s broader public language is “build and ship real projects,” with community support around getting stuck and figuring things out.

**INFERENCE:** The reward is an incentive and a continuation of the learning loop, not a wage for a timer. The relevant output is a project or artifact that can be demonstrated and reviewed. This is why “hours in, prizes out” is an incomplete description: it omits the project, its theme or constraints, the evidence, the review, and the community around it.

### Audience and variation

**OFFICIAL / FIRST-PARTY:** Hack Club centers high-school-age teens. The YSWS participation guide says participants verify that they are teenagers; it describes government ID and, in certain listed countries, student ID plus a report card/transcript as verification routes. Individual programs publish their own age windows. For example, Stardance lists 13–18, while Highway’s public site described a different high-school eligibility window. Do not flatten a specific program’s age limit into a universal numerical range.

**OFFICIAL / FIRST-PARTY:** Hack Club’s YSWS guide says programs can create their own rules and requirements. Public examples include open-ended programs; limited themes; a required language/framework; a hardware design; a weekly cadence; hours-based shops; quality-rated shops; fixed goods; grants; and invitations to in-person events. Programs have individual names, websites, themes, and mechanics.

### The role of shipping

**OFFICIAL / FIRST-PARTY:** “Ship” generally means publish or submit a completed project to that program’s review flow. It may be a repository, public demo, functioning hardware, project write-up, or another program-defined artifact. The common ecosystem vocabulary does not imply that every program requires a deployed website or open-source repository.

**INFERENCE:** The cultural center is a visible thing someone made, plus enough context for another person to understand it. Time tracking can support a review, but it cannot by itself establish project fit, participant contribution, functionality, originality, or technical quality.

## 3. Official/universal rules

The public YSWS guide explicitly introduces a short **Universal rules** list. The evidence below is limited to what that list and other first-party public documentation actually say.

| Finding | Required rule label | Evidence and boundary |
|---|---|---|
| Do not inflate time by generating fake activity or recording a black screen. Pausing/cutting Lapse breaks is advised. | **UNIVERSAL / OFFICIAL** | Explicitly listed as a universal YSWS rule in the [YSWS guide](https://readme.hackclub.com/ysws). This is an anti-fraud expectation, not a detailed universal detection algorithm. |
| Do not submit the same project time to more than one YSWS. | **UNIVERSAL / OFFICIAL** | Explicit no-double-dipping rule in the [YSWS guide](https://readme.hackclub.com/ysws). Whether separate later work on a continuing project qualifies must be judged against the actual programs’ rules; do not infer that a repository can never appear in two programs. |
| Do not submit Hackatime time accrued before that YSWS started. | **UNIVERSAL / OFFICIAL** | Explicit in the [YSWS guide](https://readme.hackclub.com/ysws). The participant must check the program start and the eligible time window. |
| Teen verification is part of the YSWS participation path. | **UNIVERSAL / OFFICIAL** | The guide says participants verify they are teenagers and describes supported documents. Exact program age limits and available verification methods can still vary by program/country; do not expose or duplicate verification documents without authorization. |
| Reading documentation or watching a video is learning time, not counted build time. | **COMMON PATTERN** | This appears in the official guide’s philosophy section, outside its explicit “Universal rules” bullet list. Treat it as strong first-party guidance, while still checking each program’s published policy. |
| Projects should be original and participant-built. | **COMMON PATTERN** | Repeated in program rules and examples, including hardware guidance that rejects direct copying. The reviewed sources do not define a single universal originality test. |
| Public repository, hosted demo, screenshots, BOM, journals, or open source may be required. | **PROGRAM-SPECIFIC** | Examples vary: Stardance requires open-source work; some other programs request a repo/demo/screenshots; hardware programs can require a BOM or photographs. These are not universal deliverables. |
| Minimum hours, theme, tech stack, reward math, AI use, team credit, calendar, review scoring, and customs rules. | **PROGRAM-SPECIFIC** | These vary across public program rules. No cross-program common numeric threshold or formula was found. |
| Appeals, partial-hour approval, exact reviewer permissions, or a universal AI policy. | **UNCERTAIN / NEEDS HUMAN CONFIRMATION** | No ecosystem-wide standard was found in the public sources reviewed. A program may publish its own policy. |

**Loadout-specific distinction:** The four technical tracks, a Capability Statement, a technical-fit gate, a proposed 40% AI-implementation ceiling, journals assigned to tracked minutes, reviewer-controlled multi-track XP allocation, and the Bolts/Requisition economy come from LOADOUT’s own plans. They are not established Hack Club-wide YSWS requirements.

## 4. Common but non-universal patterns

- **PROGRAM EXAMPLE:** A program website explains its theme and rules, with Slack as a place to ask questions or find peers. The YSWS Catalog includes program website and Slack fields, but not every listing has both.
- **PROGRAM EXAMPLE:** Hackatime is frequently used for coding time; Lapse is used for screen/camera time-lapse evidence; some hardware flows ask for journals, photos, or bills of materials. Which evidence is accepted is program-defined.
- **PROGRAM EXAMPLE:** Participants publish, upload, or submit a project, then wait for review. Public examples ask for different combinations of repo, demo, screenshot, documentation, physical build, or progress journal.
- **PROGRAM EXAMPLE:** Some programs provide reviewer feedback and allow adjustments/resubmission before the deadline. The public YSWS Catalog FAQ says this may be possible; it is not an unconditional universal right.
- **PROGRAM EXAMPLE:** Projects may be rewarded directly with physical goods, grant value, virtual currency, shop access, digital services, or an event opportunity.
- **INFERENCE:** A common participant friction is navigating distinct program sites, Slack channels, identity/login flows, time trackers, submission forms, review state, and fulfillment. Clear links and consistent state explanations help without forcing all programs into a single workflow.
- **INFERENCE:** Public catalog records are useful for discovery but should not be treated as a guaranteed source of live deadlines. During this research, the directory’s rendered page and its indexed/listing data did not present a consistent active-program count. Recheck a program’s own page before using dates or status in LOADOUT announcements.

## 5. Participant lifecycle

This is a representative map, not a claim that every program uses every stage.

| Stage | Ecosystem status | Typical evidence / variation | What LOADOUT should account for |
|---|---|---|---|
| Discover a program | **COMMON PATTERN** | The public YSWS directory, Hack Club pages, and community can surface events. Each program has its own identity and site. | Explain LOADOUT’s technical niche quickly and link to official eligibility, Slack, rules, and status pages once configured. |
| Check fit and rules | **UNIVERSAL / OFFICIAL** for checking the program’s rules; exact requirements are **PROGRAM-SPECIFIC** | The YSWS guide explicitly tells participants to read each event’s rules. Themes range widely; some accept broad projects and some do not. | Put technical eligibility examples and exclusions before signup. Keep LOADOUT fit separate from later quality scoring. |
| Verify / RSVP / join community | Teen verification is **UNIVERSAL / OFFICIAL** in the public guide; RSVP and Slack are **PROGRAM-SPECIFIC** | Signup/authentication and RSVP vary. Slack is common but not an unconditional gate in every source. | Do not assume RSVP is a universal YSWS step. Keep eligibility verification distinct from Hackatime OAuth and LOADOUT account setup. |
| Start a project | Program theme and start window are **PROGRAM-SPECIFIC**; no pre-start Hackatime time is **UNIVERSAL / OFFICIAL** | Participants choose a project and install a tracker if required. Some programs are guided; others expect a self-directed build. | Record a clear project start/eligible time window. Explain whether prior or imported work is allowed for context but not reward. |
| Track work / journal | Hackatime and Lapse are **COMMON PATTERNS**; mandatory journals and accepted time sources are **PROGRAM-SPECIFIC** | Software time can be recorded through editor heartbeats; hardware/CAD may use Lapse or evidence/logbooks. Some programs require journal entries or time attribution. | Continue LOADOUT’s journal/time-assignment design. Treat provider time as evidence that still needs project attribution and review. |
| Publish and ship | Actual project submission is central; exact artifact requirements are **PROGRAM-SPECIFIC** | Depending on the program: public repository, demo, screenshot, documentation, working physical build, photos, BOM, or submitted form. | Require evidence proportional to the artifact. Hardware should support photos/video/measurements; software should support repo/demo/reproduction evidence. |
| Review | A review is **COMMON PATTERN**; sequence, roles, scoring, and response times are **PROGRAM-SPECIFIC** | Public docs describe functional checks, organizer rules review, and fraud review; broad events may instead use peer ratings. | Publish review stages, decision states, notes, and next steps. Don’t imply an ecosystem-wide SLA, appeals process, or partial-approval rule. |
| Revise / resubmit | **PROGRAM-SPECIFIC** | Some programs permit changes before deadline and provide rejection reasons; others may have a different correction path. | Define “changes requested,” deadline effects, resubmission limits, and appeals before Season 00. |
| Receive and use reward | **PROGRAM-SPECIFIC** | Could be an account balance/shop, a fixed part kit, a card grant, digital credits, reimbursement, or invitation. | Keep quote math and reward availability explicit. Separate earned progress from inventory, spending, purchase approval, and delivery state. |
| Fulfillment / support | **COMMON PATTERN**, details **PROGRAM-SPECIFIC** | Digital delivery can differ from shipping; physical delivery may involve address, stock, customs, and wait time. | Support regional alternatives, status updates, receipt/evidence retention, and clear help routes. Don’t publish stock or delivery promises without live configuration. |

**INFERENCE — likely friction points:** Unclear theme/eligibility, uncertainty about whether old time is eligible, missing evidence, ambiguous project ownership, a long review wait, unclear correction paths, and shipping/customs surprises. These are sensible UX risks to design around; the inspected sources do not quantify their prevalence.

## 6. Organizer lifecycle

### What is publicly documented

- **OFFICIAL / FIRST-PARTY:** Hack Club’s [Project YSWS](https://project.hackclub.com/overview/welcome/) offers a public path for club-oriented beginner workshops. Its overview says workshop proposals should fill a gap in existing offerings, teach a skill creatively, and be beginner-friendly enough to go from start to submission in 1–3 hours. It offers mentorship, a funded in-person run-through at its stated rate, and logistics such as submission forms, Airtable, and HCB. A few successful workshops may be invited to expand into an official YSWS; the public page says that expansion includes a website and active submission review.
- **OFFICIAL / FIRST-PARTY:** The main YSWS guide points organizers to a Slack Canvas for creating a Slack and behind-the-scenes setup. That Canvas requires Slack access; its contents were not available in this research run.
- **OFFICIAL / FIRST-PARTY:** Public sources identify the Hack Club Slack as the community for project questions, peer support, and event channels. The program’s particular channel and whether it is mandatory remain program-specific.
- **OFFICIAL / FIRST-PARTY:** The YSWS Catalog is an open-source, community-editable directory with program metadata, filters, JSON, and RSS. It is a discovery/indexing project; the catalog itself is not proof of a program’s approval or funding.

### Lifecycle map and limits

| Organizer activity | Evidence label | Research result |
|---|---|---|
| Differentiate the idea | **OFFICIAL / FIRST-PARTY** for Project YSWS workshop proposals; otherwise **INFERENCE** | Project YSWS explicitly asks for gaps in existing offerings. Public ecosystem variation makes a distinctive theme or participant outcome useful, but no universal proposal rubric was found. |
| Submit proposal / draft | **UNVERIFIED** | The linked organizer Canvas is sign-in-gated. `#ysws-drafts` discussion and review conventions were not verified publicly. |
| Get mentorship / funding / legal setup | **PROGRAM-SPECIFIC** | Project YSWS publishes one workshop funding/mentorship route. It is not proof of a general budget, sponsor approval, or HCB entitlement for every independent program. |
| Set up community and RSVP | **PROGRAM-SPECIFIC** | Slack channels and signup/RSVP differ. No public universal sequence was found. |
| Publish website and rules | **PROGRAM-SPECIFIC** | Project YSWS says a scaled official program involves a website and active review; other independent projects may use their own formats. |
| Staff review / support | **PROGRAM-SPECIFIC** | Public examples show reviewer, organizer, fraud, support, and fulfillment roles. The specific staffing model differs. |
| Fund and fulfill rewards | **PROGRAM-SPECIFIC** | May use donated products, sponsor credits, physical stock, card grants, reimbursements, or a shop. Budget, inventory, shipping, and regional availability must be defined. |
| Close or repeat a season | **UNVERIFIED / PROGRAM-SPECIFIC** | Public pages show fixed deadlines, ongoing programs, and recurring seasons; a universal closeout or organizer renewal process was not found. |

**PRIVATE / NOT VERIFIED FROM PUBLIC SOURCES:** The content of the organizer Canvas, private Slack channels, `#ysws-drafts` proposal/review practice, internal budget approval, sponsor negotiation, and any unwritten organizer launch checklist.

## 7. Hackatime / Lapse / other tracking

| Tool | What it records (public description) | Relevance and limits |
|---|---|---|
| **Hackatime** | **OFFICIAL / FIRST-PARTY:** A free/open-source WakaTime-compatible coding-time tracker. Editor plugins send heartbeats with activity metadata such as file/project/language/branch and timestamps, depending on client. Ordinary heartbeats do not send source-file contents or screenshots. It supports project mapping to GitHub repositories and exposes an OAuth/API integration path. | Strong fit for software-editor activity. A heartbeat stream is not proof that every minute was meaningful, original, eligible, or attributable to a particular ship. Project-name mapping can be wrong. OAuth scopes and integration permission must be deliberate. Sources: [Docs](https://hackatime.hackclub.com/docs), [privacy and tracked data](https://hackatime.hackclub.com/docs/configuration/privacy), [projects/GitHub](https://hackatime.hackclub.com/docs/configuration/projects), [OAuth apps](https://hackatime.hackclub.com/docs/oauth/oauth-apps). |
| **Lapse** | **OFFICIAL / FIRST-PARTY:** Hack Club’s time-lapse tool for screen/camera recordings, integrated with Hackatime. Lapse’s public repository says recordings are encrypted before publication and describes the product as user-controlled; its custom-client documentation describes locally captured sessions, encrypted upload, and the tus upload protocol. | Useful where editor heartbeats are a poor fit, such as hardware/CAD. Video is more privacy-sensitive than metadata; never assume a program reviewer can view a participant’s encrypted media or that every YSWS uses it. Confirm integration, consent, access, retention, and reviewer-visible evidence. Sources: [Lapse](https://lapse.hackclub.com/), [repository](https://github.com/hackclub/lapse), [custom-client docs](https://github.com/hackclub/lapse/blob/main/docs/custom-clients.md). |
| **Lookout** | **SOURCE-CODE OBSERVATION:** A separate service intended to embed periodic screenshot capture into Hack Club programs. Its public README describes per-minute screenshot sessions, inactivity pause/stop behavior, and program-owned decisions about associating sessions with users/projects and using results. | Do not confuse it with Lapse. It is a program-integrated evidence service, not a universal participant account/tracker. Use requires program integration and review of current privacy/security terms. Source: [hackclub/lookout](https://github.com/hackclub/lookout). |

### Time evidence rules and limitations

- **UNIVERSAL / OFFICIAL:** Fake activity, black-screen recording, double-dipping time, and pre-start Hackatime time are excluded by the public YSWS guide.
- **COMMON PATTERN:** The guide’s philosophy excludes learning-only time such as reading docs or watching a tutorial, while building/debugging with that knowledge is the practice the programs want to incentivize.
- **PROGRAM-SPECIFIC:** Art caps, allowed activity, required tracking tool, session review, journal requirements, and how evidence is submitted differ by program.
- **INFERENCE:** Hackatime answers “what editor activity metadata was recorded?” It does not answer “who authored this feature, is it in scope, is it duplicated, or does it work?” Lapse/Lookout add visual evidence but also add privacy and consent concerns.
- **LOADOUT RECOMMENDATION:** Keep Hackatime/Lapse as evidence sources, not reward engines. Preserve LOADOUT’s journal assignment and unique-minute ledger, partial review if retained in the canonical plan, and evidence links. Do not assume provider history is eligible without the YSWS date window and program consent.

## 8. Review + moderation

### Public review models

- **OFFICIAL / FIRST-PARTY — staged review:** The public YSWS guide describes a Shipwright functionality check, handoff to the event organizer for program-rule compliance, and a final Fraud Squad check. It also notes an alternate peer-voting model for broad programs that accept any project.
- **PROGRAM EXAMPLE — peer quality rating:** Stardance says “no judges, no winners,” has other teens rate a published project, and awards stardust based on rating. The guide describes Flavortown’s participant-voting approach as another broad-program example. This is not the sole or universal review pattern.
- **SOURCE-CODE OBSERVATION — Forge:** Forge’s public repo documentation describes project states such as pending/approved/returned/rejected, a project pitch reviewed by staff, subsequent ships, devlogs, Slack-thread notifications, and role-gated admin screens. It documents audit history, support tickets, bans, and explicit role/permission checks. See [Forge source](https://github.com/hackclub/forge) and its repository-maintained [architecture notes](https://github.com/hackclub/forge/blob/main/AGENTS.md).
- **SOURCE-CODE OBSERVATION — Pixl:** The public server tree separates auth, Hackatime, projects, shop, notifications, moderation, and YSWS utilities into server modules/routes. The README describes project CRUD, moderation, and Hack Club OAuth in a game-oriented service. See [Pixl](https://github.com/hackclub/pixl) and [server routes](https://github.com/hackclub/pixl/tree/main/apps/server/src/routes).

### What was not established as universal

**UNVERIFIED:** A universal appeals body, mandatory partial approval, common rejection taxonomy, reviewer throughput target, fixed review SLA, universal public reviewer notes, or one shared admin role/permission scheme. Resubmission with feedback is presented as possible in the YSWS directory FAQ, not as a guaranteed universal mechanism.

**LOADOUT RECOMMENDATION:** Retain the canonical separation between LOADOUT Fit, evidence/time validity, and quality. Show the participant which decision is pending, what was approved, what needs changes, the deadline, and how to contact support. Define independent appeal/review and moderation escalation before launch. Treat peer votes as optional evidence with anti-ring safeguards, never as a required measure of technical merit.

## 9. Rewards, shops, and fulfillment

### Observed reward models

| Model | Public example | What it demonstrates |
|---|---|---|
| Hours/quality → virtual currency → shop | **PROGRAM EXAMPLE:** Stardance uses stardust, peer project ratings, and a prize shop. Its page shows an example project-to-stardust breakdown and says item prices vary by region. Flavortown is another broad shop/currency example in the YSWS guide and its public [Rails repository](https://github.com/hackclub/flavortown). | A shop can make a wider range of prizes and savings goals legible. The earning formula and shop inventory remain each program’s own rules. |
| Direct fixed goods / parts kit | **PROGRAM EXAMPLE:** Hackpad asks participants to design a macropad and offers the parts to build it. Its public repository has separate `website` and `api` areas and an MIT license. | A narrow challenge can make reward-to-project relevance immediate and remove a participant procurement step. |
| Hardware grant by tier | **PROGRAM EXAMPLE:** Highway’s public project pages describe a hardware grant, several complexity/budget tiers, a project journal for custom projects, and a physical-build condition for its associated event invitation. The cited Highway pages describe a past program and are not a current offer. | A grant funds participant-selected parts, but requires eligibility, project-budget review, receipts/fulfillment operations, and clear build evidence. |
| Hardware grant + operational platform | **PROGRAM EXAMPLE:** Forge’s public site describes funded hardware projects; its source docs show separate project approval, devlogs, ship review, support, and fulfillment roles. | Separating project approval, evidence, support, and fulfillment improves operator visibility. |
| Restricted virtual card grant / reimbursement | **OFFICIAL / FIRST-PARTY:** HCB YSWS grant documentation describes purpose-restricted card grants. Program rules set merchant/purpose limits; reimbursement requires an itemized receipt and is reviewed by the program and then HCB. A grant only pays up to its approved amount. | This is a controlled funding tool, not a universal store balance or automatic cash-out. Requires an authorized program relationship and fulfillment policy. |
| Credits and services | **PROGRAM EXAMPLE:** Hack Club public materials and YSWS listings include hosting, domain, compute, and other digital-service rewards. | Digital delivery can avoid physical shipping but brings service-region, expiration, and account-transfer constraints that a program must publish. |
| Event/travel support | **PROGRAM EXAMPLE:** Highway and other event programs tie project completion or merit to event invitations/travel support. | Experiences can be rewards, but eligibility, capacity, travel, and accessibility differ from a shop item. |

### HCB and cross-border fulfillment

- **OFFICIAL / FIRST-PARTY:** HCB is Hack Club’s fiscal-sponsorship/financial operations service. It can provide nonprofit financial tools and cards to qualifying organizations. A fiscal sponsorship agreement governs the relationship; it is not simply a payment API that any independent YSWS can assume it may use. See [Hack Club’s HCB overview](https://hackclub.com/fiscal-sponsorship) and [HCB support](https://help.hcb.hackclub.com/).
- **OFFICIAL / FIRST-PARTY:** A YSWS card grant is issued for a purpose and can have merchant, balance, single-use, and expiration constraints. The issuing program sets the grant’s rules. Reimbursement requires an eligible purchase and receipt; the program reviews first and HCB performs a later check. See [grant card guide](https://grants.help.hcb.hackclub.com/en/articles/15410293-i-got-a-card-grant-how-do-i-use-it), [reimbursement guide](https://grants.help.hcb.hackclub.com/en/articles/15582004-how-do-i-get-reimbursed-for-a-grant-purchase), and [declined-card guidance](https://grants.help.hcb.hackclub.com/en/articles/15414377-my-grant-card-was-declined-what-can-i-do).
- **OFFICIAL / FIRST-PARTY:** HCB’s public support page says fiscal sponsorship is primarily for teen-led mission-driven projects, that participants under 18 need a guardian to co-sign the fiscal sponsorship agreement, and that international support has limitations and country-specific uncertainty. Those conditions concern HCB fiscal sponsorship, not every participant receiving a program reward.
- **OFFICIAL / FIRST-PARTY:** The YSWS guide warns that customs/import fees may apply outside the US. Stardance says its listed prize prices may vary by region and describes shipping to many countries. The sources do not establish one universal tax, shipping, customs, stock, or replacement policy.
- **INFERENCE:** International fulfillment can make nominally equal rewards unequal in landed cost, delivery time, or availability. A regional credit/card alternative can help but creates its own eligibility, merchant, receipt, currency, and legal rules.

**LOADOUT RECOMMENDATION:** Keep Bolts as LOADOUT program currency and model order quote, sponsorship, stock, location, shipping/tax treatment, reservation, cancellation/refund, and fulfillment status as distinct concepts. Do not promise a fixed public cash conversion. Use HCB only if the responsible Hack Club/HCB team has approved the sponsor/fiscal path and exact card or reimbursement workflow.

## 10. Authentication, permissions, and account systems

- **OFFICIAL / FIRST-PARTY:** Teen verification is a Hack Club participation step. The verification system is distinct from a participant’s program login, Hackatime connection, and HCB account.
- **OFFICIAL / FIRST-PARTY:** Hackatime documents OAuth apps and scopes for integrations. Request only the scopes required and obtain participant consent; do not treat an OAuth token as program permission to inspect unrelated account data.
- **SOURCE-CODE OBSERVATION — Pixl:** Its server README describes Hack Club OAuth and a TypeScript/Express service; server modules include auth/session, Hackatime, projects, uploads, notifications, and moderation. This is an example architecture, not a Hack Club identity standard.
- **SOURCE-CODE OBSERVATION — Forge:** Its public implementation notes describe roles for user/admin/reviewer/support/fulfillment plus explicit permission arrays and individual permission checks. It includes ban/moderation controls and audit history. This is useful evidence that operational roles may need separation; other programs may use different models.
- **UNVERIFIED:** A general YSWS convention for account/profile settings, staff impersonation, account recovery, appeal authority, retention periods, or participant-data export was not found.

**LOADOUT RECOMMENDATION:** Separate participant, reviewer, support, fulfillment, and administrator capabilities. Apply least privilege, auditable staff actions, and reviewable access to evidence. Keep teen verification records, shipping addresses, payment/receipt details, private journals, and public profile data in separate access boundaries. Do not copy authentication/security code during research.

## 11. Infrastructure and reusable patterns

These are observations about named public projects, not ecosystem requirements.

- **SOURCE-CODE OBSERVATION — YSWS Catalog:** A lightweight static-site pattern: program metadata in `data.yml`, a browser interface for status/search/filter, generated JSON, and RSS. It is a good example of keeping public program discovery content-driven. The catalog is maintained as a separate public project and can lag source program pages.
- **SOURCE-CODE OBSERVATION — Pixl:** The public repo is a monorepo with `apps` and `packages`. Its server README describes Node/TypeScript/Express, Supabase persistence, Hack Club OAuth, HTTP/WebSocket game services, projects linked to Hackatime, notifications, and moderation. Its tree includes route modules for auth, Hackatime, projects, shop, uploads, reports, and notifications, alongside game-only routes. The documented service-role database client bypasses RLS, so LOADOUT should review its security boundary before reusing any server pattern. Source: [repository](https://github.com/hackclub/pixl), [server directory](https://github.com/hackclub/pixl/tree/main/apps/server), [routes](https://github.com/hackclub/pixl/tree/main/apps/server/src/routes).
- **SOURCE-CODE OBSERVATION — Forge:** A Rails app with React/Inertia, Pundit policies, PostgreSQL, background jobs, Slack event handling, role-checked admin screens, audit history, project pitches, ships, devlogs, and support-ticket relay. Its repo documentation states that admin routes and individual permissions are guarded. Source: [Forge](https://github.com/hackclub/forge) and [repository implementation notes](https://github.com/hackclub/forge/blob/main/AGENTS.md).
- **SOURCE-CODE OBSERVATION — Flavortown:** A Rails application whose README describes Docker-based local setup, a web service and separate worker service, and Coolify deployment. Its repository is a different stack from Pixl and Forge. Source: [Flavortown](https://github.com/hackclub/flavortown).
- **SOURCE-CODE OBSERVATION — Hackpad:** A focused hardware YSWS repository with `website` and `api` directories, Docker configuration, CI files, and a published MIT license. Source: [Hackpad](https://github.com/hackclub/hackpad).
- **SOURCE-CODE OBSERVATION — Lapse:** A client/server/worker deployment with PostgreSQL and Redis, media processing, encrypted recordings, and resumable tus uploads. This complexity exists because Lapse handles video; it is not a reason for LOADOUT to self-host time tracking. Source: [Lapse](https://github.com/hackclub/lapse) and its [custom-client docs](https://github.com/hackclub/lapse/blob/main/docs/custom-clients.md).
- **UNVERIFIED:** No common CDN/storage vendor, notification provider, observability stack, test strategy, or deployment platform across YSWS programs was established. Individual codebases differ.
- **UNVERIFIED:** `EDRipper/ysws-template` could not be inspected through the public GitHub page or raw README in this run. Its stack, license, features, and current availability must not be guessed. Retry during Stage 1 source audit before considering any code reuse; follow canonical plan `07` licensing checks.

**LOADOUT RECOMMENDATION:** Keep one coherent architecture, and audit the precise repository revision, license, security model, and app coupling before copying. Public source visibility does not itself grant reuse rights. Do not import auth/security code merely because another YSWS uses it.

## 12. Representative program comparisons

The examples below teach different things. Older programs are explicitly marked as historical; they are not presented as active offers on the research date.

### Stardance — broad/general builder program

- **PROGRAM EXAMPLE:** The 2026 page accepts a wide range of technical projects for teens aged 13–18, requires published open-source work, gives feedback through peer ratings, awards stardust, and uses a regionalized prize shop. It also shows an example hours-to-stardust-to-shop breakdown and a verified-hours certificate. [Rules/site](https://stardance.hackclub.com/rules).
- **LOADOUT can learn:** Show a concrete example of how a project progresses to a reward; make regional pricing visible; offer beginner guidance and real project examples.
- **LOADOUT should not copy:** Its broad eligibility, open-source requirement, or peer-rating economy as if they were universal YSWS rules or LOADOUT’s own technical-fit policy.

### Flavortown — broad shop/currency and peer-quality example

- **PROGRAM EXAMPLE:** Hack Club’s YSWS guide uses Flavortown as an example of an any-project program with participant quality voting; its public Rails source documents a separately deployed worker and shop-oriented application. The YSWS guide cites Flavortown as a 2026 program example, but its season/availability may have changed by the research date. [Guide](https://readme.hackclub.com/ysws), [source repository](https://github.com/hackclub/flavortown).
- **LOADOUT can learn:** A configurable shop and user-visible quality feedback can support varied projects when the program intentionally accepts broad scope.
- **LOADOUT should not copy:** Open-ended eligibility or voting as a substitute for the canonical LOADOUT Fit gate and reviewer allocation.

### Pixl — strong program identity and reusable engineering source

- **PROGRAM EXAMPLE:** Pixl describes a story-driven 2D world with NPC “trials,” general project submissions, Pixels earned from hours, and a large shop. The public repository and server code are the explicit engineering base discussed in LOADOUT plan `04`; it also contains game-world, realtime, moderation, project, shop, and tracking domains. [Program/repository](https://github.com/hackclub/pixl), [server routes](https://github.com/hackclub/pixl/tree/main/apps/server/src/routes).
- **LOADOUT can learn:** A memorable name/gimmick, a discoverable project archive, and operational tooling can help a program feel like its own world.
- **LOADOUT should not copy:** The open-world, NPC, game-loop identity or its Pixels economy. Canonical plan `04` already marks those as source-specific and outside LOADOUT’s product.

### Forge — focused hardware grants and operational review

- **PROGRAM EXAMPLE:** Forge is listed as a hardware-funding YSWS. Public repo documentation describes a Slack pitch, staff approval/return/rejection, participant devlogs (including a GitHub `JOURNAL.md` sync path), ship review, support ticket relay, role-specific admin permissions, audit logging, and fulfillment operations. [Program](https://forge.hackclub.com/), [public source](https://github.com/hackclub/forge), [repository architecture notes](https://github.com/hackclub/forge/blob/main/AGENTS.md).
- **LOADOUT can learn:** Separate proposal approval, in-progress logs, final ship review, support, and fulfillment. Audit staff decisions and enforce fine-grained permissions.
- **LOADOUT should not copy:** Hardware-grant-specific pitch approval, Slack workflow, Rails stack, or its internal operations assumptions as a required LOADOUT design.

### Highway — historical hardware grant + build + event path

- **PROGRAM EXAMPLE:** Highway’s public pages describe tiered per-project hardware funding, journaling for custom projects, an actual physical build, and a separate event invitation condition. Its pages refer to a 2025 program/event, so this is a historical pattern, not a current reward promise. [Overview](https://highway.hackclub.com/getting-started/overview), [FAQ](https://highway.hackclub.com/getting-started/faq), [project guidelines](https://codex.hackclub.com/archive/highway/project-guidelines/).
- **LOADOUT can learn:** A grant can reward tangible build completion, with complexity and funding tied to published criteria. Journals are especially useful when users procure and assemble physical systems.
- **LOADOUT should not copy:** Highway’s point scale, project caps, funding amounts, event condition, or old deadline. They were program-specific and are not current LOADOUT values.

### Hackpad — narrow hardware challenge with a concrete kit

- **PROGRAM EXAMPLE:** Hackpad centers on designing a macropad/mini-keyboard and ships a parts kit. Its repository is MIT-licensed and has separate website/API areas. The repo’s presence does not establish that the program is accepting submissions now. [Site/repository](https://github.com/hackclub/hackpad).
- **LOADOUT can learn:** A well-scoped prompt can make “what counts” and what reward enables obvious, especially for hardware beginners.
- **LOADOUT should not copy:** A single build format or kit list into a program whose four tracks intentionally cover many kinds of technical capability.

### Smelt — technically narrow software challenge

- **PROGRAM EXAMPLE:** Smelt’s 2025 README asks participants to build a Svelte/SvelteKit website, include an Easter egg, publish it, and submit it. The README lists time thresholds for swag and Hackatime as the tracker; it also publishes its stack and MIT license. Its stated 2025 dates are past. [Repository/README](https://github.com/hackclub/smelt).
- **LOADOUT can learn:** A narrow challenge benefits from a short checklist and a clear example of the minimum ship.
- **LOADOUT should not copy:** Framework-specific eligibility or low hour thresholds into LOADOUT’s lifetime technical-capability progression.

## 13. Hack Club product/culture notes

- **OFFICIAL / FIRST-PARTY:** Hack Club presents itself as a teen-centered community where people make things, help one another, and have fun. The README describes Slack, open-source projects, public work, workshops, and playful community traditions. The main site shows real teen projects and links to program work. See [Hack Club](https://hackclub.com/), [Slack guide](https://readme.hackclub.com/slack), and [Hack Club README](https://github.com/hackclub/hackclub).
- **OFFICIAL / FIRST-PARTY:** The YSWS directory and program pages do not force one universal visual brand treatment onto every project. Unique themes and program identities are expected in practice; actual examples range from playful food/games themes to hardware grants and technical frameworks.
- **INFERENCE:** The recognizable culture comes more from teen authorship, direct language, real projects, community access, practical mentorship, and a playful specific premise than from copying one set of colors or a dashboard template.
- **LOADOUT RECOMMENDATION:** Keep LOADOUT’s industrial field-manual and pixel utility style. Use direct, builder-friendly copy, real project/artifact evidence, and clear Slack/community links. Let the technical niche and equipment vocabulary provide its own gimmick; do not become a Pixl reskin or generic SaaS rewards portal.

## 14. Terminology glossary

| Term | Meaning / authority |
|---|---|
| **YSWS** | **OFFICIAL / FIRST-PARTY:** “You Ship, We Ship”: a family of programs that encourage teens to build and ship projects, then provide program-defined rewards. |
| **ship** | **COMMON PATTERN:** Publish or submit a project/artifact for that program’s review. Required proof varies by program. |
| **Hackatime** | **OFFICIAL / FIRST-PARTY:** Hack Club’s open-source coding-activity tracker using editor heartbeats and metadata; not source-code capture by ordinary heartbeat. |
| **Lapse** | **OFFICIAL / FIRST-PARTY:** Hack Club’s time-lapse recorder integrated with Hackatime; encrypted media and access details are distinct from ordinary Hackatime metadata. |
| **double-dipping** | **UNIVERSAL / OFFICIAL:** Submitting the same project time to more than one YSWS program. The rule applies to the time/work, not automatically to every later independent project in the same repo. |
| **review** | **COMMON PATTERN:** A program-specific check of functionality, rules, evidence, quality, or fraud. Reviewer roles and sequence vary. |
| **fulfillment** | **COMMON PATTERN:** Delivering an approved reward: digital issue, card grant, reimbursement, purchase, shipment, or event arrangement. |
| **HCB** | **OFFICIAL / FIRST-PARTY:** Hack Club’s financial operations and fiscal-sponsorship platform (historically “Hack Club Bank”), with program-specific grant/card/reimbursement flows. Not a universal YSWS wallet. |
| **Hack Club Slack** | **OFFICIAL / FIRST-PARTY:** Hack Club’s community chat with channels, threads, canvases, and program support spaces. A program’s Slack channel or membership gate is program-specific. |
| **RSVP** | **PROGRAM-SPECIFIC:** A registration/attendance-intent step used by some programs/events; not a universal YSWS requirement. |
| **devlog / journal** | **COMMON PATTERN:** A progress record that can describe work, time, evidence, and decisions. Whether it is required and how it is reviewed are program-specific. LOADOUT makes journals a canonical part of its own proof chain. |
| **Hack Club verification / eligibility** | **OFFICIAL / FIRST-PARTY:** Hack Club’s teen-verification process plus each program’s age and eligibility rules. The exact requirements and data access must be checked for the actual program. |
| **Nest** | **OFFICIAL / FIRST-PARTY:** A Hack Club member-facing hosting service for websites, game servers, and project backends, described in the public Services guide. Not a requirement for shipping a project. |
| **Signal** | **LOADOUT-SPECIFIC:** LOADOUT’s planned recognition of meaningful external project reach/usage. Not a general Hack Club metric or universal reward rule. |
| **Bolts** | **LOADOUT-SPECIFIC:** LOADOUT’s planned single global spendable program currency. Not a Hack Club-wide currency. |
| **Requisition** | **LOADOUT-SPECIFIC:** LOADOUT’s planned scarce, one-use specialization benefit for eligible reward orders. Not an ecosystem-standard voucher. |
| **Digital Loadout** | **LOADOUT-SPECIFIC:** LOADOUT’s permanent record of accepted shipped technical artifacts. Not a Hack Club account feature. |

## 15. Implications for LOADOUT

### Must respect

- **LOADOUT RECOMMENDATION:** Enforce the public Hack Club time rules that apply to YSWS participation: honest tracking, no double-dipping the same time, and no pre-start Hackatime time. Publish an evidence correction path without weakening those rules.
- **LOADOUT RECOMMENDATION:** Treat teen eligibility/verification and data access as separate from ordinary sign-in. Confirm what LOADOUT is permitted to rely on before integrating verification or collecting documents.
- **LOADOUT RECOMMENDATION:** Publish LOADOUT’s own project fit, start window, allowed evidence, journal, team, originality, AI, review, reward, and fulfillment rules. Do not label LOADOUT’s `40%` AI proposal, technical-fit boundary, four tracks, or XP formula as Hack Club policy.
- **LOADOUT RECOMMENDATION:** Retain canonical product decisions in `00–07`. This research adds ecosystem context only.
- **LOADOUT RECOMMENDATION:** Respect privacy differences between metadata, journals, photos, addresses, card/receipt data, and encrypted time-lapse media. Use provider integrations only with approved OAuth/data scopes.

### Strongly recommended

- **LOADOUT RECOMMENDATION:** Preserve the existing evidence chain: time source → journal entry → project capability statement → submitted ship → review decision. Reject duplicate minute assignment and make each project’s eligible work window visible.
- **LOADOUT RECOMMENDATION:** Separate the LOADOUT Fit gate, work/time validity, and quality review. Give a participant actionable feedback and a clear review-state timeline.
- **LOADOUT RECOMMENDATION:** Make one clear participant path with optional Slack community access, tracker setup, evidence examples, submission steps, and reward/fulfillment status. Explain which steps are required in LOADOUT.
- **LOADOUT RECOMMENDATION:** Balance rewards for international participants. Show regional availability and fulfillment limitations before order confirmation; do not promise an item, shipping date, or public Bolt conversion until configuration supports it.
- **LOADOUT RECOMMENDATION:** Keep separate least-privilege roles for reviewers, support, moderators, admins, and fulfillment operators, with audit records for sensitive actions.
- **LOADOUT RECOMMENDATION:** Use real LOADOUT project artifacts and a distinctive handmade visual language. Borrow the ecosystem’s warmth and specificity, not another program’s branding or lore.

### Optional

- **LOADOUT RECOMMENDATION:** An example price/eligibility walkthrough, public journals, a program directory feed, optional Slack announcements, beginner documentation, external usage evidence, or sponsor-specific challenges may help once LOADOUT’s core loop is stable.
- **LOADOUT RECOMMENDATION:** A limited set of parts grants, approved reimbursement, digital service credits, or region-adapted alternatives could complement the planned shop, if sponsor and legal operations permit.
- **LOADOUT RECOMMENDATION:** Use a static program catalog/JSON/RSS approach if LOADOUT later needs a separate public program listing; it is an example pattern, not a required architecture.

### Avoid

- **LOADOUT RECOMMENDATION:** Do not turn tracked hours into the whole definition of achievement; keep project fit, shipped artifact, authorship, evidence, and review meaningful.
- **LOADOUT RECOMMENDATION:** Do not borrow universal-program rules from one named example: open project scope, an open-source requirement, participant voting, hourly rate, reward amount, team split, or program age window.
- **LOADOUT RECOMMENDATION:** Do not require Lapse screenshots/video for every project or expose sensitive recordings by default. Use the minimum evidence needed for review.
- **LOADOUT RECOMMENDATION:** Do not create a large social feed, arbitrary engagement leaderboard, complex AI anti-fraud detector, or extensive organizer tooling before it supports the core ship/review/reward loop.
- **LOADOUT RECOMMENDATION:** Do not present HCB as a guaranteed checkout provider, direct cash equivalence, or automatic international solution.
- **LOADOUT RECOMMENDATION:** Do not reuse `EDRipper/ysws-template` code until it is accessible, its exact version and license are inspected, and compatibility with LOADOUT’s architecture is established.

### Needs Hack Club confirmation

1. **UNVERIFIED:** Whether LOADOUT is accepted/recognized as an official Hack Club YSWS, any required organizer proposal/review steps, and which branding or public claims it may use.
2. **UNVERIFIED:** The private organizer Canvas and any `#ysws-drafts` proposal culture, including expected reviewers, timeline, funding, and launch checklist.
3. **UNVERIFIED:** Whether LOADOUT can rely on Hack Club teen verification, what OAuth/API scopes or data-sharing agreements would be available, who may see eligibility state, and how long any related data may be retained.
4. **UNVERIFIED:** Current Hackatime/Lapse integration permissions, what evidence the LOADOUT reviewer is allowed to see, Lapse recording visibility, and whether any program-specific integration approval is needed.
5. **UNVERIFIED:** How Fraud Squad escalation should work for a standalone program, what evidence may be sent, and which decisions remain with LOADOUT reviewers.
6. **UNVERIFIED:** Whether a LOADOUT sponsor/fiscal arrangement may use HCB, which entity owns the funds, which participant grant/card/reimbursement workflows are supported, eligibility limitations, and required receipt/report controls.
7. **UNVERIFIED:** International reward fulfillment, taxes, customs, age/guardian requirements, and appropriate alternatives for participants whose region cannot be served.
8. **UNVERIFIED:** Whether LOADOUT’s AI cap, learning-time exclusion details, multi-track XP allocation, project-version rules, originality threshold, and any appeal policy align with the specific YSWS’s organizer expectations. They remain LOADOUT-owned rules unless changed by the human.

## 16. Items requiring Hack Club confirmation

The confirmation queue above is deliberately separate from verified public facts. In particular:

- **PRIVATE / NOT VERIFIED FROM PUBLIC SOURCES:** The organizer Canvas linked from the YSWS guide and the `#ysws-drafts` channel/process.
- **UNVERIFIED:** `EDRipper/ysws-template` public access, repository status, license, and implementation details. Direct GitHub and raw README retrieval failed in this run; no code or license claims are made.
- **UNVERIFIED:** LOADOUT’s official YSWS status, funding path, HCB participation, access to shared teen verification, reviewer data rights, or permission to use central anti-fraud services.
- **UNVERIFIED:** A universal AI rule, appeal process, partial-hour policy, team allocation, review SLA, fulfillment timeline, or cross-program staff-permission model.

## 17. Sources

Unless otherwise noted, links below were accessed **2026-10-04**. Official pages and code can change; current implementation work should re-check them.

### Hack Club / YSWS first-party context

- [Hack Club home](https://hackclub.com/)
- [YSWS Programs directory](https://ysws.hackclub.com/)
- [Hack Club README — You Ship, We Ship](https://readme.hackclub.com/ysws)
- [Hack Club README — Slack](https://readme.hackclub.com/slack)
- [Hack Club README — Services and developer tools (includes Nest)](https://readme.hackclub.com/services)
- [Project YSWS](https://project.hackclub.com/)
- [Project YSWS — Welcome and workshop guidance](https://project.hackclub.com/overview/welcome/)
- [Hack Club Help Center](https://help.hackclub.com/)
- [Hack Club YSWS Catalog repository](https://github.com/hackclub/YSWS-Catalog)
- [YSWS Catalog data source](https://github.com/hackclub/YSWS-Catalog/blob/main/data.yml)

### Tracking and time evidence

- [Hackatime documentation](https://hackatime.hackclub.com/docs)
- [Hackatime privacy and tracked data](https://hackatime.hackclub.com/docs/configuration/privacy)
- [Hackatime projects and GitHub mapping](https://hackatime.hackclub.com/docs/configuration/projects)
- [Hackatime OAuth apps](https://hackatime.hackclub.com/docs/oauth/oauth-apps)
- [Lapse website](https://lapse.hackclub.com/)
- [Lapse repository](https://github.com/hackclub/lapse)
- [Lapse custom-client documentation](https://github.com/hackclub/lapse/blob/main/docs/custom-clients.md)
- [Lookout repository and integration overview](https://github.com/hackclub/lookout)

### HCB / grants / fulfillment

- [Hack Club fiscal sponsorship / HCB](https://hackclub.com/fiscal-sponsorship)
- [HCB grant card guide](https://grants.help.hcb.hackclub.com/en/articles/15410293-i-got-a-card-grant-how-do-i-use-it)
- [HCB reimbursement guide](https://grants.help.hcb.hackclub.com/en/articles/15582004-how-do-i-get-reimbursed-for-a-grant-purchase)
- [HCB declined grant card guidance](https://grants.help.hcb.hackclub.com/en/articles/15414377-my-grant-card-was-declined-what-can-i-do)
- [HCB fiscal sponsorship eligibility](https://help.hcb.hackclub.com/en/articles/15409923-who-can-apply-for-fiscal-sponsorship)

### Program and source-code examples

- [Stardance rules and shop](https://stardance.hackclub.com/rules)
- [Flavortown source repository](https://github.com/hackclub/flavortown)
- [Pixl source repository](https://github.com/hackclub/pixl)
- [Pixl server routes](https://github.com/hackclub/pixl/tree/main/apps/server/src/routes)
- [Forge program](https://forge.hackclub.com/)
- [Forge source repository](https://github.com/hackclub/forge)
- [Forge repository-maintained architecture notes](https://github.com/hackclub/forge/blob/main/AGENTS.md)
- [Highway historical overview](https://highway.hackclub.com/getting-started/overview)
- [Highway historical FAQ](https://highway.hackclub.com/getting-started/faq)
- [Highway historical project guidelines](https://codex.hackclub.com/archive/highway/project-guidelines/)
- [Hackpad source repository](https://github.com/hackclub/hackpad)
- [Smelt source repository / 2025 program README](https://github.com/hackclub/smelt)
- [Requested YSWS template repository — unavailable to inspect in this run](https://github.com/EDRipper/ysws-template)
