import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { BlobServiceClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "UseDevelopmentStorage=true";
const containerName = `verification-${Date.now()}`;
const service = BlobServiceClient.fromConnectionString(connectionString);
const container = service.getContainerClient(containerName);

const userId = "00000000-0000-4000-8000-000000000001";
const caseId = "10000000-0000-4000-8000-000000000001";
const documentId = "20000000-0000-4000-8000-000000000001";
const path = `users/${userId}/cases/${caseId}/documents/${documentId}`;
const content = Buffer.from("documento ficticio para verificar Azurite\n", "utf8");
const expectedHash = createHash("sha256").update(content).digest("hex");

try {
  await container.create();

  const access = await container.getAccessPolicy();
  assert.equal(access.blobPublicAccess, undefined, "El contenedor no debe tener acceso público.");

  const blob = container.getBlockBlobClient(path);
  await blob.uploadData(content, {
    blobHTTPHeaders: { blobContentType: "application/pdf" },
    metadata: { sha256: expectedHash },
  });

  const properties = await blob.getProperties();
  assert.equal(properties.contentType, "application/pdf");
  assert.equal(properties.metadata?.sha256, expectedHash);

  const downloaded = await blob.downloadToBuffer();
  assert.deepEqual(downloaded, content);

  await blob.delete();
  assert.equal(await blob.exists(), false, "El archivo debía haber sido eliminado.");

  console.log("Azurite validado: contenedor privado, carga, lectura, hash y eliminación correctos.");
} finally {
  await container.deleteIfExists();
}
