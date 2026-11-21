import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { endImpersonation } from "@/lib/platform/impersonation";
import { clearImpersonationCookie, IMPERSONATION_COOKIE, readViewer } from "@/lib/platform/session";

// The "ACTING AS <person>" bar on every participant page while a staff member impersonates a builder.
//
// Ported from Stasis (references/stasis @ 7a230ced9ad793f0ad4cda30a7d71c02a58da6b6, app/components/ImpersonationBanner.tsx): a bar
// above the dashboard naming who is being acted as, with an "End Impersonation" button. Stasis builds it as a client component
// that reads a non-httpOnly "stasis-impersonating" cookie in the browser. This one is a server component: it shows only when the
// database says the open impersonation belongs to the cookie in this request (readViewer checks the row, the session, and that
// the staff member and the subject still qualify), so a copied or stale cookie cannot make it appear or hide it.
//
// Only the staff member's browser holds the impersonation cookie. The subject's own session never carries it, so the subject sees
// nothing: no banner, no notification, no change to their account.
//
// With no cookie the component returns before touching the database, so ordinary requests pay one cookie lookup.
async function endFromBanner() {
  "use server";
  const token = (await cookies()).get(IMPERSONATION_COOKIE)?.value;
  if (token) await endImpersonation(token);
  await clearImpersonationCookie();
  // Back to the staff member's own view. Their own session was never replaced, so nothing else needs restoring.
  redirect("/dashboard");
}

export async function ImpersonationBanner() {
  if (!(await cookies()).get(IMPERSONATION_COOKIE)?.value) return null;
  const viewer = await readViewer();
  const acting = viewer?.impersonation;
  if (!viewer || !acting) return null;

  // Inline styles on the platform tokens: this stream does not own the platform stylesheets. The bar is sticky so it stays in view
  // while scrolling, and uses the error colour so it can never be mistaken for the participant's own page.
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        padding: "0.5rem 1rem",
        background: "var(--pf-err, #8a1f1f)",
        color: "var(--pf-bg, #fff)",
        fontWeight: 700,
      }}
    >
      <span>
        ACTING AS <strong>{viewer.displayName}</strong>
        <span style={{ fontWeight: 400 }}> (you are {acting.actorName}, staff)</span>
      </span>
      <form action={endFromBanner}>
        <button type="submit" className="pf-btn">
          End impersonation
        </button>
      </form>
    </div>
  );
}
