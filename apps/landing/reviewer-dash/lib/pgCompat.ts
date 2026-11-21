// LOADOUT stand-in for Pixl's lib/pgCompat.ts (a Postgres query helper). The reviewer site has no database for review data, so the
// copied modules that call `sql` (audit log writes, budget reads) get the sample-backed answer from lib/sample/opsSql.ts.
export { sql } from "./sample/opsSql";
