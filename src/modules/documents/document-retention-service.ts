import "server-only";

import type { DocumentRepository } from "@/core/documents/document-repository";
import type { DocumentStorage } from "@/core/storage/document-storage";

export type DocumentRetentionResult = {
  scanned: number;
  deleted: number;
  skipped: number;
  failed: number;
};

export class DocumentRetentionService {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly storage: DocumentStorage,
  ) {}

  async run(limit: number): Promise<DocumentRetentionResult> {
    const candidates = await this.documents.listExpiredForDeletion(limit);
    const result: DocumentRetentionResult = {
      scanned: candidates.length,
      deleted: 0,
      skipped: 0,
      failed: 0,
    };

    for (const document of candidates) {
      try {
        await this.storage.delete(document.storage);
        const marked = await this.documents.markDeleted(
          document.id,
          document.caseId,
          document.userId,
          "retention",
        );
        if (marked) result.deleted += 1;
        else result.skipped += 1;
      } catch (error) {
        result.failed += 1;
        console.error("document_retention_delete_failed", {
          caseId: document.caseId,
          documentId: document.id,
          message: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    return result;
  }
}
