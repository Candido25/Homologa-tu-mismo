import "server-only";

import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient, type ContainerClient } from "@azure/storage-blob";
import type {
  DocumentStorage,
  ReadDocumentResult,
  StoreDocumentInput,
  StoredDocumentObject,
} from "@/core/storage/document-storage";
import {
  documentPath,
  hash,
  requireAllowedMimeType,
  requireDocumentPath,
  validateContent,
} from "@/adapters/storage/document-storage-rules";
import { getAzureBlobConfig } from "@/lib/env";

export class AzureBlobDocumentStorage implements DocumentStorage {
  private readonly service: BlobServiceClient;
  private readonly caseDocumentsContainer: string;
  private readonly allowedContainers: Set<string>;

  constructor() {
    const config = getAzureBlobConfig();
    const credential = new DefaultAzureCredential();
    this.service = new BlobServiceClient(
      `https://${config.accountName}.blob.core.windows.net`,
      credential,
    );
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

    const path = documentPath(input);
    const sha256 = hash(input.content);
    const blob = this.container(this.caseDocumentsContainer).getBlockBlobClient(path);

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
      provider: "azure_blob",
      container: this.caseDocumentsContainer,
      path,
      sizeBytes: input.content.byteLength,
      mimeType: input.mimeType,
      sha256,
    };
  }

  async read(object: StoredDocumentObject): Promise<ReadDocumentResult> {
    if (object.provider !== "azure_blob") {
      throw new Error("Proveedor de almacenamiento no compatible.");
    }

    const path = requireDocumentPath(object.path);
    const blob = this.container(object.container).getBlockBlobClient(path);
    const properties = await blob.getProperties();
    const content = await blob.downloadToBuffer();
    const mimeType = requireAllowedMimeType(properties.contentType);

    const actualHash = hash(content);
    if (object.sha256 && actualHash !== object.sha256) {
      throw new Error("La integridad del documento no coincide con su hash registrado.");
    }

    return {
      content,
      mimeType,
      sizeBytes: content.byteLength,
    };
  }

  async delete(object: StoredDocumentObject): Promise<void> {
    if (object.provider !== "azure_blob") {
      throw new Error("Proveedor de almacenamiento no compatible.");
    }
    const path = requireDocumentPath(object.path);
    await this.container(object.container).getBlockBlobClient(path).deleteIfExists({
      deleteSnapshots: "include",
    });
  }
}
