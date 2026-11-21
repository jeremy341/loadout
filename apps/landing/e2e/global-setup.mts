import { createHmac } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The local .env.local may enable the shared admin-password gate. Browser tests keep working by carrying the same HMAC
// unlock cookie the gate sets; the password itself is never written to the storage state or any test artifact.
const HERE = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = resolve(HERE, "../.env.local");
const GATE_LABEL = "loadout-platform-gate-v1";

function configuredPassword(): string {
  if (process.env.LOADOUT_PLATFORM_PASSWORD) return process.env.LOADOUT_PLATFORM_PASSWORD;
  try {
    const line = readFileSync(ENV_FILE, "utf8").split(/\r?\n/).find((entry) => entry.startsWith("LOADOUT_PLATFORM_PASSWORD="));
    if (!line) return "";
    return line.slice("LOADOUT_PLATFORM_PASSWORD=".length).trim().replace(/^["']|["']$/g, "");
  } catch {
    return "";
  }
}

export default function globalSetup(): void {
  const password = configuredPassword();
  const cookies = [];
  if (password) {
    const token = createHmac("sha256", password).update(GATE_LABEL).digest("base64url");
    const expires = Date.now() / 1000 + 7 * 24 * 60 * 60;
    for (const domain of ["localhost", "review.localhost"]) {
      cookies.push({ name: "loadout_platform_gate", value: token, domain, path: "/", httpOnly: true, sameSite: "Lax" as const, secure: false, expires });
    }
  }
  const directory = resolve(HERE, "../test-results");
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, "storage.json"), JSON.stringify({ cookies, origins: [] }));
}
