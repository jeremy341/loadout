import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// One client per server process. Next dev reloads modules, so the client is kept on globalThis.
const globalForDb = globalThis as unknown as { loadoutDb?: PrismaClient };

export function databaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  if (!globalForDb.loadoutDb) {
    globalForDb.loadoutDb = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
  }
  return globalForDb.loadoutDb;
}
