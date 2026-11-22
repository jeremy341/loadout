import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConnectionPlaceholder } from "@/app/_components/platform/ConnectionPlaceholder";
import { SignInFrame } from "@/app/_components/platform/SignInFrame";
import { databaseConfigured } from "@/lib/platform/db";
import { hcaConfig, isSignInError, SIGN_IN_ERROR_MESSAGES } from "@/lib/platform/hca";
import { hasPlatformUnlock } from "@/lib/platform/platform-gate";
import { readViewer } from "@/lib/platform/session";

export const metadata: Metadata = {
  title: "Sign in - LOADOUT",
  robots: { index: false, follow: false },
};

// Public: this route sits outside the shell, so it never needs a signed-in builder.
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string | string[] }> }) {
  const configured = hcaConfig() !== null;
  const { error } = await searchParams;
  const code = Array.isArray(error) ? error[0] : error;
  const message = isSignInError(code) ? SIGN_IN_ERROR_MESSAGES[code] : null;
  const unlocked = await hasPlatformUnlock();
  // With the app set up, someone already signed in has no reason to be here. Check the gate first: sending a signed-in but
  // locked visitor to /dashboard would send them straight back here through the proxy, and they would never see the form.
  if (unlocked && configured && !message && databaseConfigured() && (await readViewer())) redirect("/dashboard");
  // A wrong password is announced next to the field it belongs to; every other error sits above the sign-in action.
  const gateError = !unlocked && code === "gate_failed";
  // The placeholder below already says the app is not set up, so the same sentence is not repeated as an alert.
  const showAlert = message !== null && !gateError && !(code === "not_configured" && !configured);

  return (
    <SignInFrame>
      <h1>Sign in</h1>
      {showAlert ? (
        <p className="pf-error" role="alert">
          {message}
        </p>
      ) : null}
      {!unlocked ? (
        <>
          <form method="post" action="/api/auth/platform-gate" className="pf-form pf-gate-form">
            <div className="pf-field">
              <label htmlFor="platform-password">Access password</label>
              <input
                id="platform-password"
                className="pf-input"
                name="password"
                type="password"
                required
                autoComplete="off"
                aria-invalid={gateError || undefined}
                aria-describedby={gateError ? "platform-password-error" : undefined}
              />
              {gateError && message ? (
                <p id="platform-password-error" className="pf-error" role="alert">
                  {message}
                </p>
              ) : null}
            </div>
            <button type="submit" className="pf-btn pri">Continue</button>
          </form>
        </>
      ) : configured ? (
        <a className="pf-btn pri" href="/api/auth/hackclub/start">
          Sign in with Hack Club Auth
        </a>
      ) : (
        <ConnectionPlaceholder
          name="Sign in with Hack Club Auth"
          status="Not connected"
          reason="Not set up yet. The Hack Club Auth app is not configured on this server."
        >
          <button type="button" className="pf-btn pri" disabled>
            Sign in with Hack Club Auth
          </button>
        </ConnectionPlaceholder>
      )}
    </SignInFrame>
  );
}
