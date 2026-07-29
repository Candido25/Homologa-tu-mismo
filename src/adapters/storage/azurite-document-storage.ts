import "server-only";

import { createHash } from "node:crypto";
import { BlobServiceClient, type ContainerClient } from "@azure/storage-blob";
import type {
  DocumentStorage,
  ReadDocumentResult,
  StoreDocumentInput,
  StoredDocumentObject,
} from "@/core/storage/document-storage";
import { getAzuriteConfig } from "@/lib/env";

const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;
const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const documentPathPattern = /^users\/[0-9a-f-]{36}\/cases\/[0-9a-f-]{36}\/documents\/[0-9a-f-]{36}$/i;

function requireUuid(value: string, field: string) {
  if (!uuidPattern.test(value)) throw new Error(`${field} no es un UUID válido.`);
  return value.toLowerCase();
}

function requireDocumentPath(path: string) {
  if (!documentPathPattern.test(path) || path.includes("..")) {
    throw new Error("Ruta de documento no permitida.");
  }
  return path;
}

function documentPath(input: StoreDocumentInput) {
  const userId = requireUuid(input.userId, "userId");
  const caseId = requireUuid(input.caseId, "caseId");
  const documentId = requireUuid(input.documentId, "documentId");
  return `users/${userId}/cases/${caseId}/documents/${documentId}`;
}

function validateContent(input: StoreDocumentInput) {
  if (!allowedMimeTypes.has(input.mimeType)) {
    throw new Error("Tipo MIME no permitido.");
  }
  if (input.content.byteLength === 0) throw new Error("El documento está vacío.");
  if (input.content.byteLength > MAX_DOCUMENT_SIZE) {
    throw new Error("El documento supera el límite de 25 MB.");
  }
}

function hash(content: Uint8Array) {
  return createHash("sha256").update(content).digest("hex");
}

export class AzuriteDocumentStorage implements DocumentStorage {
  private readonly service: BlobServiceClient;
  private readonly caseDocumentsContainer: string;
  private readonly allowedContainers: Set<string>;

  constructor() {
    const config = getAzuriteConfig();
    this.service = BlobServiceClient.fromConnectionString(config.connectionString);
    this.caseDocumentsContainer = config.caseDocumentsContainer;
    this.allowedContainers = new Set([
      config.caseDocumentsContainer,
      config.generatedReportsContainer,
    ]);
  }

  private container(name: string): ContainerClient {
    if (!this.allowedContainers.has(name)) {
      throw new Error("Contenedor de almacenamiento no permitido.");
    }
    return this.service.getContainerClient(name);
  }

  async store(input: StoreDocumentInput): Promise<StoredDocumentObject> {
    validateContent(input);

    const container = this.container(this.caseDocumentsContainer);
    await container.createIfNotExists();

    const path = documentPath(input);
    const sha256 = hash(input.content);
    const blob = container.getBlockBlobClient(path);

    await blob.uploadData(input.content, {
      blobHTTPHeaders: {
        blobContentType: input.mimeType,
      },
      metadata: {
        documentid: input.documentId.toLowerCase(),
        caseid: input.caseId.toLowerCase(),
        userid: input.userId.toLowerCase(),
        sha256,
      },
    });

    return {
      provider: "azurite",
      container: this.caseDocumentsContainer,
      path,
      sizeBytes: input.content.byteLength,
      mimeType: input.mimeType,
      sha256,
    };
  }

  async read(object: StoredDocumentObject): Promise<ReadDocumentResult> {
    if (object.provider !== "azurite") throw new Error("Proveedor de almacenamiento no compatible.");

    const path = requireDocumentPath(object.path);
    const blob = this.container(object.container).getBlockBlobClient(path);
    const properties = await blob.getProperties();
    const content = await blob.downloadToBuffer();
    const mimeType = properties.contentType;

    if (!mimeType || !allowedMimeTypes.has(mimeType)) {
      throw new Error("El objeto almacenado tiene un tipo MIME no permitido.");
    }

    const actualHash = hash(content);
    if (object.sha256 && actualHash !== object.sha256) {
      throw new Error("La integridad del documento no coincide con su hash registrado.");
    }

    return {
      content,
      mimeType: mimeType as ReadDocumentResult["mimeType"],
      sizeBytes: content.byteLength,
    };
  }

  async delete(object: StoredDocumentObject): Promise<void> {
    if (object.provider !== "azurite") throw new Error("Proveedor de almacenamiento no compatible.");
    const path = requireDocumentPath(object.path);
    await this.container(object.container).getBlockBlobClient(path).deleteIfExists({
      deleteSnapshots: "include",
    });
  }
}
