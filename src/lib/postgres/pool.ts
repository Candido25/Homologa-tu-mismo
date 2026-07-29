import "server-only";

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { getDatabaseUrl } from "@/lib/env";

declare global {
  var __homologaPostgresPool: Pool | undefined;
}

export function getPostgresPool() {
  if (!globalThis.__homologaPostgresPool) {
    globalThis.__homologaPostgresPool = new Pool({
      connectionString: getDatabaseUrl(),
      application_name: "homologa-tu-mismo-web",
      max: process.env.APP_ENV === "local" ? 5 : 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: process.env.NODE_ENV !== "production",
    });
  }

  return globalThis.__homologaPostgresPool;
}

export async function query<Row extends QueryResultRow = QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
): Promise<QueryResult<Row>> {
  return getPostgresPool().query<Row>(text, [...values]);
}

export async function withTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPostgresPool().connect();

  try {
    await client.query("begin");
    const result = await operation(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
