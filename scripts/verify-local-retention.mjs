import assert from "node:assert/strict";
import { BlobServiceClient } from "@azure/storage-blob";
import pg from "pg";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const databaseUrl =
  process.env.DATABASE_URL || "postgresql://homologa:homologa_local_only@localhost:5432/homologa";
const storageConnectionString =
  process.env.AZURE_STORAGE_CONNECTION_STRING || "UseDevelopmentStorage=true";
const retentionToken =
  process.env.DOCUMENT_RETENTION_JOB_TOKEN || "local-retention-job-test-only";
const sameOrigin = new URL(baseUrl).origin;
const fixtures = {
  userA: "00000000-0000-4000-8000-000000000001",
  caseA: "10000000-0000-4000-8000-000000000001",
};
const database = new pg.Client({
  connectionString: databaseUrl,
  application_name: "homologa-local-retention-verification",
});
const blobService = BlobServiceClient.fromConnectionString(storageConnectionString);
const uploadedIds = [];
const storedObjects = new Map();
let connected = false;

function uploadForm(filename, documentType) {
  const content = Buffer.from(`%PDF-1.4\n% ${filename} sin datos personales\n`, "utf8");
  const form = new FormData();
  form.set("tipoDocumento", documentType);
  form.set("archivo", new Blob([content], { type: "application/pdf" }), filename);
  return form;
}

async function request(path, init) {
  return fetch(new URL(path, baseUrl), init);
}

async function json(path, init) {
  const response = await request(path, init);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`La respuesta de ${path} no es JSON válido: ${text.slice(0, 120)}`);
  }
  return { response, data };
}

async function upload(filename, documentType) {
  const result = await json(`/api/expedientes/${fixtures.caseA}/documentos`, {
    method: "POST",
    headers: { Origin: sameOrigin },
    body: uploadForm(filename, documentType),
  });
  assert.equal(result.response.status, 201);
  const documentId = result.data.document?.id;
  assert.match(documentId, /^[0-9a-f-]{36}$/i);
  uploadedIds.push(documentId);
  return documentId;
}

try {
  await database.connect();
  connected = true;

  const missingCredential = await json("/api/internal/retencion-documental", {
    method: "POST",
  });
  assert.equal(missingCredential.response.status, 401);

  const wrongCredential = await json("/api/internal/retencion-documental", {
    method: "POST",
    headers: { Authorization: "Bearer token-interno-incorrecto" },
  });
  assert.equal(wrongCredential.response.status, 401);

  const expiredId = await upload("retencion-vencido-ficticio.pdf", "curriculum");
  const activeId = await upload("retencion-vigente-ficticio.pdf", "translation");

  const casePage = await request(`/panel/expedientes/${fixtures.caseA}`);
  assert.equal(casePage.status, 200);
  assert.match(await casePage.text(), /Se conserva hasta/);

  await database.query(
    [
      "update documents",
      "set retention_until = case",
      "when id = $1 then now() - interval '1 day'",
      "when id = $2 then now() + interval '1 day'",
      "else retention_until end",
      "where id = any($3::uuid[])",
    ].join(" "),
    [expiredId, activeId, [expiredId, activeId]],
  );

  const metadata = await database.query(
    [
      "select id, storage_container, storage_path",
      "from documents",
      "where id = any($1::uuid[])",
    ].join(" "),
    [[expiredId, activeId]],
  );
  for (const row of metadata.rows) storedObjects.set(row.id, row);

  const retention = await json("/api/internal/retencion-documental?limit=100", {
    method: "POST",
    headers: { Authorization: `Bearer ${retentionToken}` },
  });
  assert.equal(retention.response.status, 200);
  assert.equal(retention.data.ok, true);
  assert.equal(retention.data.failed, 0);
  assert.ok(retention.data.deleted >= 1);

  const states = await database.query(
    [
      "select id, status, deleted_at",
      "from documents",
      "where id = any($1::uuid[])",
    ].join(" "),
    [[expiredId, activeId]],
  );
  const expired = states.rows.find((row) => row.id === expiredId);
  const active = states.rows.find((row) => row.id === activeId);
  assert.equal(expired.status, "deleted");
  assert.ok(expired.deleted_at);
  assert.equal(active.status, "uploaded");
  assert.equal(active.deleted_at, null);

  const expiredObject = storedObjects.get(expiredId);
  const activeObject = storedObjects.get(activeId);
  const expiredBlob = blobService
    .getContainerClient(expiredObject.storage_container)
    .getBlockBlobClient(expiredObject.storage_path);
  const activeBlob = blobService
    .getContainerClient(activeObject.storage_container)
    .getBlockBlobClient(activeObject.storage_path);
  assert.equal(await expiredBlob.exists(), false);
  assert.equal(await activeBlob.exists(), true);

  const audit = await database.query(
    [
      "select actor_user_id, action, entity_type, entity_id, result, metadata",
      "from audit_events",
      "where entity_type = 'document' and entity_id = $1",
      "order by created_at desc",
      "limit 1",
    ].join(" "),
    [expiredId],
  );
  assert.equal(audit.rows[0].actor_user_id, null);
  assert.equal(audit.rows[0].action, "document.deleted");
  assert.equal(audit.rows[0].result, "success");
  assert.equal(audit.rows[0].metadata?.source, "retention");

  const secondRun = await json("/api/internal/retencion-documental?limit=100", {
    method: "POST",
    headers: { Authorization: `Bearer ${retentionToken}` },
  });
  assert.equal(secondRun.response.status, 200);
  assert.equal(secondRun.data.failed, 0);

  console.log(
    "Retención local validada: credencial interna, vencimiento, vigencia, blob, idempotencia y auditoría.",
  );
} finally {
  for (const documentId of uploadedIds) {
    try {
      await request(`/api/expedientes/${fixtures.caseA}/documentos/${documentId}`, {
        method: "DELETE",
        headers: { Origin: sameOrigin },
      });
    } catch {
      // La limpieza directa continúa debajo.
    }

    const stored = storedObjects.get(documentId);
    if (stored) {
      try {
        await blobService
          .getContainerClient(stored.storage_container)
          .getBlockBlobClient(stored.storage_path)
          .deleteIfExists({ deleteSnapshots: "include" });
      } catch {
        // El entorno local puede haberse detenido durante una prueba fallida.
      }
    }
  }

  if (connected && uploadedIds.length > 0) {
    await database.query(
      "delete from audit_events where entity_type = 'document' and entity_id = any($1::text[])",
      [uploadedIds],
    );
    await database.query("delete from documents where id = any($1::uuid[])", [uploadedIds]);
    await database.query(
      [
        "delete from case_requirements r",
        "where r.case_id = $1",
        "and r.document_type_code = any($2::text[])",
        "and r.reason = 'Documento cargado por el usuario.'",
        "and not exists (",
        "select 1 from documents d",
        "where d.case_id = r.case_id",
        "and d.document_type_code = r.document_type_code",
        "and d.status <> 'deleted'",
        ")",
      ].join(" "),
      [fixtures.caseA, ["curriculum", "translation"]],
    );
  }

  if (connected) await database.end();
}
