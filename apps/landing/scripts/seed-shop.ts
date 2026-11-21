import { db } from "../lib/platform/db";
import { seedShopFromStatic } from "../lib/platform/shop-data";

// Writes the static shop catalog and its stock rows into the database. Safe to re-run: stock and `active` are never reset.
// Run with: bun run scripts/seed-shop.ts
const seeded = await seedShopFromStatic();
console.log(`Seeded ${seeded.items} shop items and added ${seeded.stockRows} stock rows.`);
await db().$disconnect();
