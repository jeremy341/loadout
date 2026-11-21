import { defineConfig } from "prisma/config";

// The app reads DATABASE_URL at runtime (lib/db.ts). Migrations use the same variable.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
