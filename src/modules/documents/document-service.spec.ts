import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentService } from "./document-service";
import type { CaseRepository } from "@/core/cases/case-repository";
import type { DocumentRepository } from "@/core/documents/document-repository";
import type { DocumentStorage, StoredDocumentObject } from "@/core/storage/document-storage";

describe("DocumentService", () => {
  let casesMock: ReturnType<typeof vi.mocked<CaseRepository>>;
  let documentsMock: ReturnType<typeof vi.mocked<DocumentRepository>>;
  let storageMock: ReturnType<typeof vi.mocked<DocumentStorage>>;
  let documentService: DocumentService;

  beforeEach(() => {
    casesMock = {
      listRecentByUser: vi.fn(),
      getByIdForUser: vi.fn(),
      create: vi.fn(),
      updateTier: vi.fn(),
      updateStage: vi.fn(),
      addLogEntry: vi.fn(),
      getTimeline: vi.fn(),
    } as any;

    documentsMock = {
      getActiveDocumentType: vi.fn(),
      listActiveDocumentTypes: vi.fn(),
      listByCaseForUser: vi.fn(),
      listExpiredForDeletion: vi.fn(),
      getByIdForUser: vi.fn(),
      create: vi.fn(),
      markDeleted: vi.fn(),
    } as any;

    storageMock = {
      store: vi.fn(),
      read: vi.fn(),
      delete: vi.fn(),
    } as any;

    documentService = new DocumentService(
      casesMock as any,
      documentsMock as any,
      storageMock as any,
      30 // retentionDays
    );
  });

  describe("upload compensation", () => {
    const input = {
      caseId: "test-case-id",
      userId: "test-user-id",
      documentTypeCode: "TEST_DOC",
      filename: "test.pdf",
      mimeType: "application/pdf" as const,
      content: new Uint8Array([1, 2, 3]),
    };

    const storedObject: StoredDocumentObject = {
      provider: "test-provider",
      container: "test-container",
      path: "test-path",
      sizeBytes: 3,
      mimeType: "application/pdf",
      sha256: "test-hash",
    };

    beforeEach(() => {
      // Setup successful prerequisites
      (casesMock.getByIdForUser as any).mockResolvedValue({ id: "test-case-id" });
      (documentsMock.getActiveDocumentType as any).mockResolvedValue({
        code: "TEST_DOC",
        name: "Test Document",
        sensitivity: "public",
      });
      (storageMock.store as any).mockResolvedValue(storedObject);
    });

    it("should compensate by deleting stored file if documents.create fails", async () => {
      // Make create throw an error
      const createError = new Error("Database error");
      (documentsMock.create as any).mockRejectedValue(createError);

      await expect(documentService.upload(input)).rejects.toThrow(createError);

      expect(storageMock.store).toHaveBeenCalled();
      expect(documentsMock.create).toHaveBeenCalled();
      // Storage delete should be called with the object returned by store
      expect(storageMock.delete).toHaveBeenCalledWith(storedObject);
    });

    it("should log error if compensation itself fails and throw original error", async () => {
      // Make both create and delete throw errors
      const createError = new Error("Database error");
      const deleteError = new Error("Storage delete error");

      (documentsMock.create as any).mockRejectedValue(createError);
      (storageMock.delete as any).mockRejectedValue(deleteError);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(documentService.upload(input)).rejects.toThrow(createError);

      expect(storageMock.delete).toHaveBeenCalledWith(storedObject);
      expect(consoleSpy).toHaveBeenCalledWith("document_upload_compensation_failed", expect.objectContaining({
        documentId: expect.any(String),
        message: "Storage delete error"
      }));

      consoleSpy.mockRestore();
    });
  });
});
