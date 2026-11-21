import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// One client per server process. Next dev reloads modules, so the client is kept on globalThis.
const globalForDb = globalThis as unknown as { loadoutDbClientReview?: PrismaClient };
let injectedClient: PrismaClient | undefined;

// The test runner can share a module across files with different globals. Setting the client here
// reaches every caller of db(), including modules that only import db and never touch globalThis.
export function setClientForTests(value: PrismaClient | undefined): void {
  injectedClient = value;
}

export function databaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db(): PrismaClient {
  if (injectedClient) return injectedClient;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  if (!globalForDb.loadoutDbClientReview) {
    globalForDb.loadoutDbClientReview = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
  }
  return globalForDb.loadoutDbClientReview;
}
