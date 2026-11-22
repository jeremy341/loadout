import { db } from "./db";
import { eligibilityMessage, eligibilityState, type EligibilityState } from "./eligibility";
import { localTestAccountsEnabled } from "./local-accounts";

// The stored state for a signed-in builder. Local test accounts (reserved .test addresses, development only) have no Hack Club
// Auth identity and count as eligible, so the dev flow keeps working. Everyone else is judged on the stored verification status.
export async function eligibilityFor(viewer: { id: string; email: string }): Promise<EligibilityState> {
  if (localTestAccountsEnabled() && viewer.email.endsWith(".test")) return "ok";
  const person = await db().person.findUnique({
    where: { id: viewer.id },
    select: { verificationStatus: true },
  });
  return eligibilityState({ verificationStatus: person?.verificationStatus });
}

// For server actions that create a project or submit one. Returns the plain refusal message, or null when the builder may go on.
// Browsing never calls this. The ship worker calls it before a submit.
export async function eligibilityRefusal(viewer: { id: string; email: string }): Promise<string | null> {
  const state = await eligibilityFor(viewer);
  return state === "ok" ? null : eligibilityMessage(state);
}
