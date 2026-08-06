import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL es obligatorio para aplicar semillas.");

const root = process.cwd();
const seedNames = ["0001_reference_data.sql", "9000_local_test_fixtures.sql"];
const client = new pg.Client({
  connectionString: databaseUrl,
  application_name: "homologa-database-seeds",
  connectionTimeoutMillis: 15_000,
});

try {
  await client.connect();
  for (const name of seedNames) {
    const sql = await readFile(path.join(root, "database", "seeds", name), "utf8");
    await client.query(sql);
    console.log(`seed_applied ${name}`);
  }
} finally {
  await client.end();
}
