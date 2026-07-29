import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { BlobServiceClient } from "@azure/storage-blob";
import pg from "pg";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const databaseUrl =
  process.env.DATABASE_URL || "postgresql://homologa:homologa_local_only@localhost:5432/homologa";
const storageConnectionString =
  process.env.AZURE_STORAGE_CONNECTION_STRING || "UseDevelopmentStorage=true";
const sameOrigin = new URL(baseUrl).origin;
const maxDocumentSize = 25 * 1024 * 1024;
const fixtures = {
  userA: "00000000-0000-4000-8000-000000000001",
  caseA: "10000000-0000-4000-8000-000000000001",
  caseB: "10000000-0000-4000-8000-000000000002",
};
const content = Buffer.from("%PDF-1.4\n% documento ficticio sin datos personales\n", "utf8");
const expectedHash = createHash("sha256").update(content).digest("hex");
const database = new pg.Client({
  connectionString: databaseUrl,
  application_name: "homologa-local-document-flow-verification",
});
const blobService = BlobServiceClient.fromConnectionString(storageConnectionString);

let connected = false;
let documentId = null;
let storedObject = null;

function uploadForm(fileContent, mimeType, filename, documentType = "degree") {
  const form = new FormData();
  form.set("tipoDocumento", documentType);
  form.set("archivo", new Blob([fileContent], { type: mimeType }), filename);
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

try {
  await database.connect();
  connected = true;

  const blockedOrigin = await json(`/api/expedientes/${fixtures.caseA}/documentos`, {
    method: "POST",
    headers: { Origin: "https://example.invalid" },
    body: uploadForm(content, "application/pdf", "bloqueado.pdf"),
  });
  assert.equal(blockedOrigin.response.status, 403);

  const foreignCase = await json(`/api/expedientes/${fixtures.caseB}/documentos`, {
    method: "POST",
    headers: { Origin: sameOrigin },
    body: uploadForm(content, "application/pdf", "ajeno.pdf"),
  });
  assert.equal(foreignCase.response.status, 404);

  const invalidMime = await json(`/api/expedientes/${fixtures.caseA}/documentos`, {
    method: "POST",
    headers: { Origin: sameOrigin },
    body: uploadForm(Buffer.from("texto ficticio"), "text/plain", "invalido.txt"),
  });
  assert.equal(invalidMime.response.status, 415);

  const spoofedMime = await json(`/api/expedientes/${fixtures.caseA}/documentos`, {
    method: "POST",
    headers: { Origin: sameOrigin },
    body: uploadForm(Buffer.from("esto no es un PDF"), "application/pdf", "suplantado.pdf"),
  });
  assert.equal(spoofedMime.response.status, 422);

  const emptyFile = await json(`/api/expedientes/${fixtures.caseA}/documentos`, {
    method: "POST",
    headers: { Origin: sameOrigin },
    body: uploadForm(new Uint8Array(), "application/pdf", "vacio.pdf"),
  });
  assert.equal(emptyFile.response.status, 422);

  const oversizedFile = await json(`/api/expedientes/${fixtures.caseA}/documentos`, {
    method: "POST",
    headers: { Origin: sameOrigin },
    body: uploadForm(
      new Uint8Array(maxDocumentSize + 1),
      "application/pdf",
      "demasiado-grande.pdf",
    ),
  });
  assert.equal(oversizedFile.response.status, 413);

  const unknownType = await json(`/api/expedientes/${fixtures.caseA}/documentos`, {
    method: "POST",
    headers: { Origin: sameOrigin },
    body: uploadForm(content, "application/pdf", "tipo-desconocido.pdf", "unknown_type"),
  });
  assert.equal(unknownType.response.status, 422);

  const uploaded = await json(`/api/expedientes/${fixtures.caseA}/documentos`, {
    method: "POST",
    headers: { Origin: sameOrigin },
    body: uploadForm(content, "application/pdf", "expediente-ficticio.pdf"),
  });
  assert.equal(uploaded.response.status, 201);
  documentId = uploaded.data.document?.id;
  assert.match(documentId, /^[0-9a-f-]{36}$/i);
  assert.equal(uploaded.data.document.documentTypeCode, "degree");
  assert.equal(uploaded.data.document.originalFilename, "expediente-ficticio.pdf");
  assert.equal(uploaded.data.document.sizeBytes, content.byteLength);

  const metadataResult = await database.query(
    [
      "select user_id, case_id, storage_provider, storage_container, storage_path,",
      "mime_type, size_bytes, sha256, status, retention_until",
      "from documents where id = $1",
    ].join(" "),
    [documentId],
  );
  storedObject = metadataResult.rows[0];
  assert.equal(storedObject.user_id, fixtures.userA);
  assert.equal(storedObject.case_id, fixtures.caseA);
  assert.equal(storedObject.storage_provider, "azurite");
  assert.match(
    storedObject.storage_path,
    new RegExp(
      `^users/${fixtures.userA}/cases/${fixtures.caseA}/documents/${documentId}$`,
      "i",
    ),
  );
  assert.equal(storedObject.mime_type, "application/pdf");
  assert.equal(Number(storedObject.size_bytes), content.byteLength);
  assert.equal(storedObject.sha256, expectedHash);
  assert.equal(storedObject.status, "uploaded");
  assert.ok(storedObject.retention_until);

  const container = blobService.getContainerClient(storedObject.storage_container);
  const access = await container.getAccessPolicy();
  assert.equal(access.blobPublicAccess, undefined, "El contenedor documental debe ser privado.");
  const blob = container.getBlockBlobClient(storedObject.storage_path);
  const properties = await blob.getProperties();
  assert.equal(properties.metadata?.userid, fixtures.userA);
  assert.equal(properties.metadata?.caseid, fixtures.caseA);
  assert.equal(properties.metadata?.documentid, documentId);
  assert.equal(properties.metadata?.sha256, expectedHash);

  const listed = await json(`/api/expedientes/${fixtures.caseA}/documentos`);
  assert.equal(listed.response.status, 200);
  assert.ok(listed.data.documents.some((item) => item.id === documentId));
  assert.equal(listed.response.headers.get("cache-control"), "private, no-store");

  const downloaded = await request(
    `/api/expedientes/${fixtures.caseA}/documentos/${documentId}`,
  );
  assert.equal(downloaded.status, 200);
  assert.equal(downloaded.headers.get("content-type"), "application/pdf");
  assert.equal(downloaded.headers.get("x-content-type-options"), "nosniff");
  assert.match(downloaded.headers.get("content-disposition") || "", /attachment/);
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), content);

  const foreignRead = await json(
    `/api/expedientes/${fixtures.caseB}/documentos/${documentId}`,
  );
  assert.equal(foreignRead.response.status, 404);

  const blockedDelete = await json(
    `/api/expedientes/${fixtures.caseA}/documentos/${documentId}`,
    {
      method: "DELETE",
      headers: { Origin: "https://example.invalid" },
    },
  );
  assert.equal(blockedDelete.response.status, 403);

  const deleted = await request(
    `/api/expedientes/${fixtures.caseA}/documentos/${documentId}`,
    {
      method: "DELETE",
      headers: { Origin: sameOrigin },
    },
  );
  assert.equal(deleted.status, 204);

  const deletedMetadata = await database.query(
    "select status, deleted_at from documents where id = $1",
    [documentId],
  );
  assert.equal(deletedMetadata.rows[0].status, "deleted");
  assert.ok(deletedMetadata.rows[0].deleted_at);
  assert.equal(await blob.exists(), false);

  const readAfterDelete = await json(
    `/api/expedientes/${fixtures.caseA}/documentos/${documentId}`,
  );
  assert.equal(readAfterDelete.response.status, 404);

  console.log(
    "Flujo documental local validado: origen, propietario, MIME, tamaño, metadatos, hash, lectura y eliminación.",
  );
} finally {
  if (documentId) {
    try {
      await request(`/api/expedientes/${fixtures.caseA}/documentos/${documentId}`, {
        method: "DELETE",
        headers: { Origin: sameOrigin },
      });
    } catch {
      // La limpieza directa continúa debajo.
    }

    if (storedObject) {
      try {
        await blobService
          .getContainerClient(storedObject.storage_container)
          .getBlockBlobClient(storedObject.storage_path)
          .deleteIfExists({ deleteSnapshots: "include" });
      } catch {
        // El entorno local puede haberse detenido durante una prueba fallida.
      }
    }

    if (connected) {
      await database.query("delete from documents where id = $1", [documentId]);
      await database.query(
        [
          "delete from case_requirements r",
          "where r.case_id = $1 and r.document_type_code = 'degree'",
          "and r.reason = 'Documento cargado por el usuario.'",
          "and not exists (",
          "select 1 from documents d",
          "where d.case_id = r.case_id and d.document_type_code = r.document_type_code",
          "and d.status <> 'deleted'",
          ")",
        ].join(" "),
        [fixtures.caseA],
      );
    }
  }

  if (connected) await database.end();
}
