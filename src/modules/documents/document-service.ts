import "server-only";

import { randomUUID } from "node:crypto";
import type { CaseRepository } from "@/core/cases/case-repository";
import type {
  DocumentRepository,
  DocumentSummary,
} from "@/core/documents/document-repository";
import type {
  DocumentStorage,
  ReadDocumentResult,
  StoredDocumentObject,
} from "@/core/storage/document-storage";

type UploadDocumentInput = {
  caseId: string;
  userId: string;
  documentTypeCode: string;
  filename: string;
  mimeType: StoredDocumentObject["mimeType"];
  content: Uint8Array;
};

export type UploadDocumentResult =
  | { ok: true; document: DocumentSummary }
  | { ok: false; reason: "case_not_found" | "document_type_not_found" };

export type ReadOwnedDocument = {
  filename: string;
  content: ReadDocumentResult["content"];
  mimeType: ReadDocumentResult["mimeType"];
  sizeBytes: number;
};

function safeFilename(filename: string) {
  const leaf = filename.replaceAll("\\", "/").split("/").pop() || "";
  const normalized = leaf.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 180);
  return normalized || "documento";
}

export class DocumentService {
  constructor(
    private readonly cases: CaseRepository,
    private readonly documents: DocumentRepository,
    private readonly storage: DocumentStorage,
    private readonly retentionDays: number,
  ) {}

  async list(caseId: string, userId: string): Promise<DocumentSummary[] | null> {
    const ownedCase = await this.cases.getByIdForUser(caseId, userId);
    if (!ownedCase) return null;
    return this.documents.listByCaseForUser(caseId, userId);
  }

  async upload(input: UploadDocumentInput): Promise<UploadDocumentResult> {
    const ownedCase = await this.cases.getByIdForUser(input.caseId, input.userId);
    if (!ownedCase) return { ok: false, reason: "case_not_found" };

    const documentType = await this.documents.getActiveDocumentType(input.documentTypeCode);
    if (!documentType) return { ok: false, reason: "document_type_not_found" };

    const documentId = randomUUID();
    const filename = safeFilename(input.filename);
    const retentionUntil = new Date(
      Date.now() + this.retentionDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const stored = await this.storage.store({
      userId: input.userId,
      caseId: input.caseId,
      documentId,
      filename,
      mimeType: input.mimeType,
      content: input.content,
    });

    try {
      const document = await this.documents.create({
        id: documentId,
        caseId: input.caseId,
        userId: input.userId,
        documentType,
        originalFilename: filename,
        storage: stored,
        retentionUntil,
      });
      return { ok: true, document };
    } catch (error) {
      try {
        await this.storage.delete(stored);
      } catch (cleanupError) {
        console.error("document_upload_compensation_failed", {
          documentId,
          message: cleanupError instanceof Error ? cleanupError.message : "unknown",
        });
      }
      throw error;
    }
  }

  async read(
    documentId: string,
    caseId: string,
    userId: string,
  ): Promise<ReadOwnedDocument | null> {
    const document = await this.documents.getByIdForUser(documentId, caseId, userId);
    if (!document) return null;

    const result = await this.storage.read(document.storage);
    return {
      filename: document.originalFilename,
      content: result.content,
      mimeType: result.mimeType,
      sizeBytes: result.sizeBytes,
    };
  }

  async delete(documentId: string, caseId: string, userId: string): Promise<boolean> {
    const document = await this.documents.getByIdForUser(documentId, caseId, userId);
    if (!document) return false;

    await this.storage.delete(document.storage);
    return this.documents.markDeleted(documentId, caseId, userId);
  }
}
