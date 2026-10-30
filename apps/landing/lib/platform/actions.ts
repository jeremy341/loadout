"use server";

import { revalidatePath } from "next/cache";
import { checkReason, recordAudit } from "./audit";
import { db } from "./db";
import { forgetFlag, KNOWN_FLAGS, writeFlag, type FlagName } from "./flags";
import { updatePersonAccess } from "./staff";
import { requireStaff } from "./session";

export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string; field?: string }
  | { status: "saved"; message: string };

export async function updateAccess(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireStaff();
  const personId = String(formData.get("personId") ?? "");
  const reason = checkReason(formData.get("reason"));
  if (!reason.ok) return { status: "error", field: "reason", message: reason.message };

  const result = await updatePersonAccess(
    actor.id,
    {
      personId,
      staff: formData.get("staff") === "on",
      banned: formData.get("banned") === "on",
    },
    reason,
  );
  if (!result.ok) return { status: "error", message: result.message };
  revalidatePath("/dashboard/staff/users");
  revalidatePath("/dashboard/staff/audit");
  return { status: "saved", message: result.changed.join(". ") + "." };
}

export async function setFlagState(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireStaff();
  const name = String(formData.get("name") ?? "") as FlagName;
  if (!(name in KNOWN_FLAGS)) return { status: "error", message: "That flag is not known." };
  const reason = checkReason(formData.get("reason"));
  if (!reason.ok) return { status: "error", field: "reason", message: reason.message };
  const enabled = formData.get("target") === "on";

  await db().$transaction(async (tx) => {
    const before = await tx.featureFlag.findUnique({ where: { name } });
    await writeFlag(name, enabled, tx);
    await recordAudit(tx, {
      actorId: actor.id,
      action: "flag.set",
      targetType: "flag",
      targetId: name,
      reason: reason.reason,
      before: { enabled: before?.enabled ?? false },
      after: { enabled },
    });
  });
  forgetFlag(name);
  revalidatePath("/dashboard/staff/flags");
  revalidatePath("/dashboard/staff/audit");
  return { status: "saved", message: `${KNOWN_FLAGS[name]} is ${enabled ? "on" : "off"}.` };
}
