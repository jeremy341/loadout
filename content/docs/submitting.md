---
title: "Submitting your ship"
description: "What to send with a ship, and what we'll check when we open it."
group: "BUILD & REVIEW"
order: 65
status: draft
---

Before you send your project in, bring the source, demo and journal together and explain the version you're shipping. Imagine a reviewer opening it without you there: they should know what to try, where to find the files and which parts you want them to look at. If they'd need you to walk them through everything over Slack, add that explanation to the submission.

## Where should I start? {#send}

If it's your first ship, introduce what you've built so far. If you're sending an update, start with what's new since the last version and include the records for those new hours. The reviewer can then focus on those changes instead of trying to work out what was already paid for.

Check the links from a signed-out browser or ask a friend to open them. A demo that depends on your own account may look fine to you and be completely inaccessible to everyone else.

## A submission outline {#outline}

Not sure how to put the description together? These headings give you somewhere to start. Adapt them to your project; a circuit and a command-line tool won't need exactly the same explanation:

1. **Project and version.** What somebody can do with it, and what this ship adds.
2. **Tracks.** Where the substantial work belongs and why.
3. **How it works.** The important design decisions, difficult parts and tradeoffs. A diagram can save a lot of explanation here.
4. **Evidence.** Source or design files, demo, journal and the tests or measurements behind your claims.
5. **Your part.** What you made yourself, what teammates did and what you reused.
6. **AI and sources.** Where you got help, what you changed and how you checked it.
7. **Known limits.** What remains missing, unreliable or untested.

For the [sensor board](/docs/shipping#example), “evidence” means more than a photo. It includes the board files and firmware, a working demonstration and measurements that support the claimed behavior. The journal then explains the decisions that connect those files to the finished version.

## What we check first {#reviewers}

We open the files and demo, check that the project fits LOADOUT, and look for evidence that the claimed work and hours are yours. If something is missing, the feedback should tell you what to fix or provide.

Once those checks pass, the team looks at Originality, Technical Depth, Execution and Documentation when it accepts or sends back the ship. Accepted ships earn 10 Ore per approved hour. [Project review](/docs/review) explains the decision.

## Credit and AI disclosure {#disclosure}

As you explain the project, say where you had help. For example, you might have used a vendor driver unchanged but written the storage layer yourself. Mentioning that alongside the storage explanation helps the reviewer understand your part much more than “used some libraries” at the bottom of the page.

Name the designs, tutorials and AI tools you used, follow the relevant licenses and explain what you added. For a team build, each person describes their own contribution and records their own hours. [AI & team contributions](/docs/ai-teams) includes examples.
