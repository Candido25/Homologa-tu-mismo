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

    const promises = candidates.map(async (document) => {
      try {
        await this.storage.delete(document.storage);
        const marked = await this.documents.markDeleted(
          document.id,
          document.caseId,
          document.userId,
          "retention",
        );
        return { success: true, marked, document };
      } catch (error) {
        console.error("document_retention_delete_failed", {
          caseId: document.caseId,
          documentId: document.id,
          message: error instanceof Error ? error.message : "unknown",
        });
        return { success: false, error, document };
      }
    });

    const outcomes = await Promise.all(promises);

    for (const outcome of outcomes) {
      if (outcome.success) {
        if (outcome.marked) result.deleted += 1;
        else result.skipped += 1;
      } else {
        result.failed += 1;
      }
    }

    return result;
  }
}
