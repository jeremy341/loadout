// The Slack helper list (the BotHelper table). Server only. The rules are in helpers.ts.
//
// API:
//   listHelpers() -> string[]                              Slack ids, oldest first
//   addHelper(adminSlackId, slackId, admins) -> HelperWrite   forbidden unless the admin is in `admins`; audited in the same transaction
//   removeHelper(adminSlackId, slackId, admins) -> HelperWrite  the same check and audit; removing a missing helper is not an error
import { recordAudit } from "../audit";
import { db } from "../db";
import { helperReason, isBotAdmin } from "./helpers";

export type HelperWrite = { ok: true } | { ok: false; code: "forbidden" };

export async function listHelpers(): Promise<string[]> {
  const rows = await db().botHelper.findMany({ orderBy: { addedAt: "asc" }, select: { slackId: true } });
  return rows.map((row) => row.slackId);
}

export async function addHelper(adminSlackId: string, slackId: string, admins: readonly string[]): Promise<HelperWrite> {
  if (!isBotAdmin(adminSlackId, admins)) return { ok: false, code: "forbidden" };
  await db().$transaction(async (tx) => {
    await tx.botHelper.upsert({ where: { slackId }, update: {}, create: { slackId, addedBy: adminSlackId } });
    await recordAudit(tx, {
      actorId: `slack:${adminSlackId}`,
      action: "bot.helper.add",
      targetType: "bot_helper",
      targetId: slackId,
      reason: helperReason("added"),
    });
  });
  return { ok: true };
}

export async function removeHelper(adminSlackId: string, slackId: string, admins: readonly string[]): Promise<HelperWrite> {
  if (!isBotAdmin(adminSlackId, admins)) return { ok: false, code: "forbidden" };
  await db().$transaction(async (tx) => {
    await tx.botHelper.deleteMany({ where: { slackId } });
    await recordAudit(tx, {
      actorId: `slack:${adminSlackId}`,
      action: "bot.helper.remove",
      targetType: "bot_helper",
      targetId: slackId,
      reason: helperReason("removed"),
    });
  });
  return { ok: true };
}
