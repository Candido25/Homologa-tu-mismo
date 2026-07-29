import assert from "node:assert/strict";
import pg from "pg";

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://homologa:homologa_local_only@localhost:5432/homologa";

const fixtures = {
  userA: "00000000-0000-4000-8000-000000000001",
  userB: "00000000-0000-4000-8000-000000000002",
  caseA: "10000000-0000-4000-8000-000000000001",
  caseB: "10000000-0000-4000-8000-000000000002",
};

const client = new pg.Client({
  connectionString: databaseUrl,
  application_name: "homologa-local-isolation-verification",
});
let connected = false;

async function getOwnedCase(caseId, userId) {
  const result = await client.query(
    [
      "select id, user_id, title",
      "from public.cases",
      "where id = $1 and user_id = $2",
      "limit 1",
    ].join(" "),
    [caseId, userId],
  );

  return result.rows[0] || null;
}

async function listCases(userId) {
  const result = await client.query(
    [
      "select id, user_id, title",
      "from public.cases",
      "where user_id = $1",
      "order by updated_at desc",
    ].join(" "),
    [userId],
  );

  return result.rows;
}

try {
  await client.connect();
  connected = true;

  const userACases = await listCases(fixtures.userA);
  const userBCases = await listCases(fixtures.userB);

  assert.ok(
    userACases.some((caseItem) => caseItem.id === fixtures.caseA),
    "El fixture del usuario A no existe. Ejecuta db:migrate y db:seed.",
  );
  assert.ok(
    userBCases.some((caseItem) => caseItem.id === fixtures.caseB),
    "El fixture del usuario B no existe. Ejecuta db:migrate y db:seed.",
  );

  assert.equal(
    userACases.some((caseItem) => caseItem.id === fixtures.caseB),
    false,
    "El usuario A no debe listar expedientes del usuario B.",
  );
  assert.equal(
    userBCases.some((caseItem) => caseItem.id === fixtures.caseA),
    false,
    "El usuario B no debe listar expedientes del usuario A.",
  );

  assert.equal(
    await getOwnedCase(fixtures.caseB, fixtures.userA),
    null,
    "El usuario A no debe abrir el expediente del usuario B por ID.",
  );
  assert.equal(
    await getOwnedCase(fixtures.caseA, fixtures.userB),
    null,
    "El usuario B no debe abrir el expediente del usuario A por ID.",
  );

  console.log("Aislamiento local validado: cada usuario ficticio solo ve sus expedientes.");
} catch (error) {
  if (error?.code === "ECONNREFUSED") {
    console.error(
      "No se pudo conectar a PostgreSQL local. Ejecuta npm run local:up, db:migrate y db:seed antes de validar aislamiento.",
    );
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
} finally {
  if (connected) await client.end();
}
