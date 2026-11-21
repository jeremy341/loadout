// Entry point. Loads and validates config, builds the Slack app and the site client (the in-memory fake when
// BOT_FAKE_SITE=1), builds Ctx, registers the modules in order (desk, then the optional modules whose folders exist),
// starts the HTTP server and shuts down cleanly on SIGINT or SIGTERM.
// Routes: POST /slack/events (Bolt), GET /health -> {"ok":true}.
import { createAccess } from "./access";
import { ConfigError, loadConfig, redact } from "./config";
import { createLogger } from "./log";
import { createSlackApp, getSlackWeb, resolveBotUserId, type CustomRoute } from "./slack/app";
import { createFakeSite } from "./site/fake";
import { createSiteClient } from "./site/client";
import type { BotModule, Ctx, Stats } from "./types";
import { createDeskModule } from "./modules/desk";
import { threadMutes } from "./modules/desk/mute";
import { createDocsAnswerer } from "./modules/docs/answer";

// Optional modules. Each folder default-exports a BotModule (or exports register(app, ctx)). A missing folder is skipped; any other import error stops startup.
const OPTIONAL_MODULES = [
  "./modules/commands/index.ts",
  "./modules/tools/index.ts",
  "./modules/notices/index.ts",
  "./modules/orphan/index.ts",
  "./modules/chat/index.ts",
] as const;

type OptionalModule = Pick<BotModule, "register"> & { name?: string };

async function loadOptional(path: string): Promise<OptionalModule | null> {
  try {
    // A variable path on purpose: the folders may not exist yet, and tsc must not need them to.
    const loaded = (await import(path)) as { default?: OptionalModule } & Partial<OptionalModule>;
    // Modules default-export a BotModule; a named register export is accepted too.
    return (loaded.default ?? (loaded as OptionalModule)) as OptionalModule;
  } catch (err) {
    if (isMissingModule(err, path)) return null;
    throw err;
  }
}

// Only "this exact file is missing" counts as missing. A broken import inside an existing module still fails.
function isMissingModule(err: unknown, path: string): boolean {
  if (!(err instanceof Error)) return false;
  const missing = ("code" in err && err.code === "ERR_MODULE_NOT_FOUND") || /Cannot find (module|package)|Module not found/.test(err.message);
  const target = path.replace(/^\.\//, "").replace(/\.ts$/, "");
  return missing && err.message.includes(target);
}

async function main(): Promise<void> {
  let config: ReturnType<typeof loadConfig>;
  try {
    config = loadConfig(process.env);
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`Config problems:\n${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  const log = createLogger(config.logLevel);
  const fakeSite = process.env.BOT_FAKE_SITE === "1";
  const site = fakeSite ? createFakeSite() : createSiteClient({ baseUrl: config.siteBaseUrl, serviceKey: config.serviceKey });

  const health: CustomRoute = {
    path: "/health",
    method: ["GET"],
    handler: (_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    },
  };

  const app = createSlackApp(config, { log, customRoutes: [health] });
  const botUserId = await resolveBotUserId(app.client);
  const web = getSlackWeb(app.client, log);
  const acl = createAccess({ site, adminSlackIds: config.adminSlackIds, onError: (code) => log.warn("helpers_unavailable", { code }) });

  const stats: Stats = { ticketsOpened: 0, answeredFromDocs: 0, autoClosed: 0, remindersSent: 0, commandsRun: 0 };
  const answerer = createDocsAnswerer({
    siteBaseUrl: config.siteBaseUrl,
    anthropicApiKey: config.anthropicApiKey,
    site,
    fetch: globalThis.fetch,
    now: () => Date.now(),
    log,
  });

  const ctx: Ctx = {
    config,
    site,
    log,
    stats,
    botUserId,
    now: () => new Date(),
    isHelper: acl.isHelper,
    isAdmin: acl.isAdmin,
    answer: answerer,
    say: web.say,
    dm: web.dm,
  };

  const registered: string[] = [];
  if (config.helpChannelId) {
    createDeskModule({ emoji: config.emoji }).register(app, ctx);
    registered.push("desk");
  }
  for (const path of OPTIONAL_MODULES) {
    let mod = await loadOptional(path);
    if (!mod) continue;
    // The chat module honours the desk's thread mutes, which a plain BotModule cannot carry; build it with the check instead.
    if (path.includes("/chat/")) {
      const { createChatModule } = await import("./modules/chat/index");
      mod = createChatModule({ isMuted: (channel, threadTs) => threadMutes.isMuted(channel, threadTs) });
    }
    if (typeof mod.register !== "function") {
      log.warn("module_has_no_register", { path });
      continue;
    }
    await mod.register(app, ctx);
    registered.push(mod.name ?? path);
  }

  await app.start(config.port);
  log.info("started", {
    port: config.port,
    botName: config.botName,
    helpChannel: redact(config.helpChannelId),
    fakeSite,
    modules: registered,
  });

  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    log.info("shutdown", { signal });
    try {
      await app.stop();
    } catch (err) {
      log.warn("stop_failed", { error: err });
    }
    process.exit(0);
  };
  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err: unknown) => {
  console.error(JSON.stringify({ level: "error", event: "startup_failed", errorName: err instanceof Error ? err.name : "unknown" }));
  process.exit(1);
});
