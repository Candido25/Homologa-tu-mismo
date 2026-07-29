import { createHash, randomUUID } from "node:crypto";
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim() || "";
const containerName =
  process.env.AZURE_STORAGE_CASE_DOCUMENTS_CONTAINER?.trim() || "case-documents";
const testAllowed = process.env.AZURE_RECOVERY_TEST_ALLOWED === "true";

if (!testAllowed) {
  throw new Error("La prueba de recuperación requiere AZURE_RECOVERY_TEST_ALLOWED=true.");
}
if (!/^[a-z0-9]{3,24}$/.test(accountName)) {
  throw new Error("AZURE_STORAGE_ACCOUNT_NAME no está configurado correctamente.");
}
if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(containerName)) {
  throw new Error("El contenedor de recuperación no es válido.");
}

const testId = randomUUID();
const blobPath = `_operations/recovery-tests/${testId}/fictitious-document.pdf`;
const content = Buffer.from(
  "%PDF-1.4\n% Homologa Tu Mismo - prueba ficticia de recuperacion\n%%EOF\n",
  "ascii",
);
const expectedHash = createHash("sha256").update(content).digest("hex");
const service = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  new DefaultAzureCredential(),
);
const container = service.getContainerClient(containerName);
const blob = container.getBlockBlobClient(blobPath);

async function waitForRestoredBlob() {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    if (await blob.exists()) return;
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  throw new Error("El blob no volvió a estar disponible después de recuperarlo.");
}

let uploaded = false;

try {
  await container.getProperties();
  await blob.uploadData(content, {
    conditions: {
      ifNoneMatch: "*",
    },
    blobHTTPHeaders: {
      blobContentType: "application/pdf",
    },
    metadata: {
      purpose: "document-recovery-test",
      fictitious: "true",
      sha256: expectedHash,
    },
  });
  uploaded = true;

  await blob.delete({
    deleteSnapshots: "include",
  });
  if (await blob.exists()) {
    throw new Error("El blob continuó disponible después de eliminarlo.");
  }

  await blob.undelete();
  await waitForRestoredBlob();

  const restored = await blob.downloadToBuffer();
  const restoredProperties = await blob.getProperties();
  const restoredHash = createHash("sha256").update(restored).digest("hex");

  if (restoredHash !== expectedHash) {
    throw new Error("El contenido recuperado no conserva su hash original.");
  }
  if (restoredProperties.metadata?.purpose !== "document-recovery-test") {
    throw new Error("Los metadatos del blob no se recuperaron correctamente.");
  }

  console.log("Recuperación Azure validada con un documento ficticio.");
  console.log(`Cuenta: ${accountName}; contenedor: ${containerName}; hash: ${restoredHash}`);
} finally {
  if (uploaded && (await blob.exists())) {
    await blob.deleteIfExists({
      deleteSnapshots: "include",
    });
  }
}
