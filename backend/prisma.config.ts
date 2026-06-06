import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use process.env (not the eager env() helper) so commands that don't need
    // a DB connection — e.g. `prisma generate` — still work when DATABASE_URL is unset.
    url: process.env.DATABASE_URL ?? "",
  },
});
