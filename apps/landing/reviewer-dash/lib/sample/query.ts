// A very small stand-in for Pixl's supabase-style query builder (lib/pgCompat.ts), over the sample rows. The copied pages call
// db.from("users").select(...).in(...) and a few like it; this answers them from memory. Unknown tables answer with no rows.
// Reads only: update, insert and delete do nothing and say so in the error, so a copied page that reaches for one does not break.
import { AUDITS, USERS } from "./index";

type Row = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the copied pages cast the rows themselves, as they do with Pixl's builder
type Result = { data: any; error: { message: string } | null; count: number | null };

function tableRows(table: string): Row[] {
  if (table === "users") return USERS() as unknown as Row[];
  if (table === "review_audits") return AUDITS as unknown as Row[];
  return [];
}

const like = (pattern: string, value: unknown, insensitive: boolean): boolean => {
  const source = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*");
  return new RegExp(`^${source}$`, insensitive ? "i" : "").test(String(value ?? ""));
};

class Query implements PromiseLike<Result> {
  private rows: Row[];
  private single = false;
  private wantCount = false;
  constructor(table: string) {
    this.rows = [...tableRows(table)];
  }
  select(_columns?: string, options?: { count?: string; head?: boolean }) {
    if (options?.count) this.wantCount = true;
    return this;
  }
  eq(column: string, value: unknown) { this.rows = this.rows.filter((row) => row[column] === value); return this; }
  neq(column: string, value: unknown) { this.rows = this.rows.filter((row) => row[column] !== value); return this; }
  is(column: string, value: unknown) { this.rows = this.rows.filter((row) => (row[column] ?? null) === value); return this; }
  not(column: string, op: string, value: unknown) {
    if (op === "is") this.rows = this.rows.filter((row) => (row[column] ?? null) !== value);
    return this;
  }
  in(column: string, values: readonly unknown[]) { this.rows = this.rows.filter((row) => values.includes(row[column])); return this; }
  gt(column: string, value: unknown) { this.rows = this.rows.filter((row) => String(row[column] ?? "") > String(value)); return this; }
  gte(column: string, value: unknown) { this.rows = this.rows.filter((row) => String(row[column] ?? "") >= String(value)); return this; }
  lt(column: string, value: unknown) { this.rows = this.rows.filter((row) => String(row[column] ?? "") < String(value)); return this; }
  lte(column: string, value: unknown) { this.rows = this.rows.filter((row) => String(row[column] ?? "") <= String(value)); return this; }
  like(column: string, pattern: string) { this.rows = this.rows.filter((row) => like(pattern, row[column], false)); return this; }
  ilike(column: string, pattern: string) { this.rows = this.rows.filter((row) => like(pattern, row[column], true)); return this; }
  order(column: string, options?: { ascending?: boolean }) {
    const dir = options?.ascending === false ? -1 : 1;
    this.rows.sort((a, b) => (a[column] === b[column] ? 0 : String(a[column] ?? "") < String(b[column] ?? "") ? -dir : dir));
    return this;
  }
  limit(count: number) { this.rows = this.rows.slice(0, count); return this; }
  range(from: number, to: number) { this.rows = this.rows.slice(from, to + 1); return this; }
  maybeSingle() { this.single = true; return this; }
  then<A = Result, B = never>(
    ok?: ((value: Result) => A | PromiseLike<A>) | null,
    fail?: ((reason: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    const result: Result = this.single
      ? { data: this.rows[0] ?? null, error: null, count: null }
      : { data: this.rows, error: null, count: this.wantCount ? this.rows.length : null };
    return Promise.resolve(result).then(ok, fail);
  }
}

const readOnly = (): Query => {
  const query = new Query("");
  return query;
};

export const sampleDb = {
  from(table: string) {
    const query = new Query(table);
    return Object.assign(query, {
      update: readOnly,
      insert: readOnly,
      upsert: readOnly,
      delete: readOnly,
    });
  },
  rpc(): PromiseLike<{ data: null; error: { message: string } }> {
    return Promise.resolve({ data: null, error: { message: "Sample data: there is no database behind this call." } });
  },
};
