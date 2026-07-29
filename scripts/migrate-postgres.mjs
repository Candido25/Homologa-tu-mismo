import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL es obligatorio para aplicar migraciones.");
}

const root = process.cwd();
const migrationsDirectory = path.join(root, "database", "migrations");
const migrationNames = (await readdir(migrationsDirectory))
  .filter((name) => /^\d+_.+\.sql$/.test(name))
  .sort((left, right) => left.localeCompare(right, "en"));

if (migrationNames.length === 0) {
  throw new Error("No se encontraron migraciones SQL.");
}

const client = new pg.Client({
  connectionString: databaseUrl,
  application_name: "homologa-database-migrations",
  connectionTimeoutMillis: 15_000,
});

try {
  await client.connect();

  for (const name of migrationNames) {
    const sql = await readFile(path.join(migrationsDirectory, name), "utf8");
    await client.query(sql);
    console.log(`migration_applied ${name}`);
  }

  if (process.argv.includes("--seed-reference")) {
    const seedPath = path.join(root, "database", "seeds", "0001_reference_data.sql");
    await client.query(await readFile(seedPath, "utf8"));
    console.log("reference_data_applied 0001_reference_data.sql");
  }

  const result = await client.query(
    "select version from schema_migrations order by version",
  );
  console.log(`migration_versions ${result.rows.map((row) => row.version).join(",")}`);
} finally {
  await client.end();
}
