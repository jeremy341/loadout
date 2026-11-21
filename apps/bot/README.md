# LOADOUT Slack bot (core)

The Slack bot for LOADOUT: the help desk, docs answers, and the module hooks for commands, tools, notices, the
"thx" rule and optional chat. The behaviour is specified in `plans/proposals/slack-bot-spec.md`. This README covers
running it; the spec covers what it does.

Stack: Bun, `@slack/bolt` v4 over the HTTP receiver (no Socket Mode), TypeScript strict.

## Run it

```sh
cd apps/bot
bun install
cp .env.example .env        # then fill in the values; never commit .env
bun test src                # unit tests
bunx tsc --noEmit           # typecheck
bun run scripts/smoke.ts    # drives the desk and docs against fakes, no network
bun run start               # starts the bot on PORT (default 3000)
```

Startup fails fast and prints one line per problem if the environment is wrong.

Set `BOT_FAKE_SITE=1` to run against the in-memory site instead of the real one (local testing only).

Routes: `POST /slack/events` (Slack events, interactivity and commands) and `GET /health` (returns `{"ok":true}`).
Point Slack's request URLs at `https://<host>/slack/events`.

## Environment

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `SLACK_BOT_TOKEN` | yes | | Bot token (`xoxb-`). |
| `SLACK_SIGNING_SECRET` | yes | | Verifies requests from Slack. |
| `SITE_BASE_URL` | yes | | http or https, no query string. Trailing slash is dropped. |
| `SERVICE_KEY_SLACK_BOT` | yes | | At least 32 characters. Sent as `x-loadout-service-key`. |
| `BOT_NAME` | no | `Rig` | The name for `<NAME>STOP` and `<NAME>START`. |
| `BOT_TRIGGER_WORDS` | no | the lower-cased name | Comma list of words the bot answers to. |
| `HELP_CHANNEL_ID` | no | empty (desk off) | Slack channel id of the help channel. |
| `COMMUNITY_CHANNEL_ID` | no | empty (off) | Announcements channel. |
| `LOG_CHANNEL_ID` | no | empty (off) | Staff log channel. |
| `ADMIN_SLACK_IDS` | no | empty | Comma list. Admins may add and remove helpers. |
| `ORPHAN_BOT_ID` | no | empty (off) | The other bot the "thx" rule watches. |
| `ORPHAN_REPLY` | no | `thx orphan` | Text of the "thx" reply. |
| `DESK_EMOJI_OPEN` | no | `eyes` | Reaction while a question is open (Slack emoji name, no colons). |
| `DESK_EMOJI_RESOLVED` | no | `white_check_mark` | Reaction once resolved. |
| `ANTHROPIC_API_KEY` | no | empty | Needed for AI answers. Without it docs answers return the best passage. |
| `CHAT_ENABLED` | no | `false` | Optional AI chat. Needs `ANTHROPIC_API_KEY`. |
| `CHAT_CHIME` | no | `false` | Lets chat join in unprompted (spec section 10). |
| `PORT` | no | `3000` | HTTP port. |
| `LOG_LEVEL` | no | `info` | `debug`, `info`, `warn` or `error`. |
| `BOT_FAKE_SITE` | no | `0` | `1` uses the in-memory site. Local testing only. |

Logs are one JSON object per line. They never contain tokens, keys, passwords or message text, and ids are shortened.

## Slack app setup

**Bot token scopes**

- `chat:write` (posts, edits, deletes its own messages, ephemeral messages)
- `channels:history` (messages in the help channel, for `message.channels`)
- `im:history` and `im:write` (DMs, for `message.im` and `conversations.open`)
- `app_mentions:read` (for `app_mention`)
- `reactions:write` (the open and resolved reactions)
- `commands` (slash commands)

**Event subscriptions** (request URL `https://<host>/slack/events`)

- `message.channels`: the help channel only. The bot ignores everything else in it.
- `message.im`: DMs (`orders on`, `orders off` and the like).
- `app_mention`: mentions, for the chat module.
- `reaction_added`: listed in the spec for future use. The desk writes reactions and does not read them.

**Interactivity**: turn on, with the same request URL. Used by the Resolve, Reopen and title buttons and the title modal.

**Slash commands**: add the `/loadout-*` commands (spec section 7) with the same request URL.

Bots cannot delete messages posted by other people. The `?resolve`-style macro message is deleted when Slack allows
it; if it refuses, the bot logs `macro_not_deleted` with the Slack error code and carries on.

## Layout

- `src/config.ts` reads and validates the environment.
- `src/log.ts` is the one-line JSON logger.
- `src/site/` is the site client (`client.ts`) and the in-memory fake (`fake.ts`).
- `src/slack/` holds the Bolt app, the shared Slack helper (`app.ts`) and pure rate-limit and error rules (`pure.ts`).
- `src/access.ts` is the helper cache (60 seconds) and the admin check.
- `src/modules/desk/` is the help desk: rules, the mute store, the flow and the Bolt wiring.
- `src/modules/docs/` is the docs corpus, text rules and the answerer.
- `src/index.ts` builds everything, registers the modules in order and handles shutdown.
- `scripts/smoke.ts` drives the desk and docs against fakes.

Optional modules (`commands`, `tools`, `notices`, `orphan`, `chat`) are loaded only when their `index.ts` exists.
Each exports `register(app, ctx)`.
