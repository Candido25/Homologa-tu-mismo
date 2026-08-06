import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentRetentionService } from '../document-retention-service';
import type { DocumentRepository, DocumentRecord } from '@/core/documents/document-repository';
import type { DocumentStorage } from '@/core/storage/document-storage';

describe('DocumentRetentionService', () => {
  let mockDocumentRepository: DocumentRepository;
  let mockDocumentStorage: DocumentStorage;
  let service: DocumentRetentionService;

  beforeEach(() => {
    mockDocumentRepository = {
      listExpiredForDeletion: vi.fn(),
      markDeleted: vi.fn(),
      getActiveDocumentType: vi.fn(),
      listActiveDocumentTypes: vi.fn(),
      listByCaseForUser: vi.fn(),
      getByIdForUser: vi.fn(),
      create: vi.fn(),
    };
    mockDocumentStorage = {
      delete: vi.fn(),
      store: vi.fn(),
      read: vi.fn(),
    };
    service = new DocumentRetentionService(mockDocumentRepository, mockDocumentStorage);
  });

  it('should handle case where no expired documents are found', async () => {
    vi.mocked(mockDocumentRepository.listExpiredForDeletion).mockResolvedValue([]);
    const result = await service.run(10);
    expect(result).toEqual({ scanned: 0, deleted: 0, skipped: 0, failed: 0 });
    expect(mockDocumentRepository.listExpiredForDeletion).toHaveBeenCalledWith(10);
    expect(mockDocumentStorage.delete).not.toHaveBeenCalled();
    expect(mockDocumentRepository.markDeleted).not.toHaveBeenCalled();
  });

  it('should successfully delete documents and mark them as deleted', async () => {
    const candidates = [
      { id: '1', caseId: 'c1', userId: 'u1', storage: { path: 'path/1' } } as DocumentRecord,
      { id: '2', caseId: 'c2', userId: 'u2', storage: { path: 'path/2' } } as DocumentRecord,
    ];
    vi.mocked(mockDocumentRepository.listExpiredForDeletion).mockResolvedValue(candidates);
    vi.mocked(mockDocumentStorage.delete).mockResolvedValue(undefined);
    vi.mocked(mockDocumentRepository.markDeleted).mockResolvedValue(true);

    const result = await service.run(10);

    expect(result).toEqual({ scanned: 2, deleted: 2, skipped: 0, failed: 0 });
    expect(mockDocumentStorage.delete).toHaveBeenCalledTimes(2);
    expect(mockDocumentRepository.markDeleted).toHaveBeenCalledTimes(2);
    expect(mockDocumentRepository.markDeleted).toHaveBeenNthCalledWith(1, '1', 'c1', 'u1', 'retention');
    expect(mockDocumentRepository.markDeleted).toHaveBeenNthCalledWith(2, '2', 'c2', 'u2', 'retention');
  });

  it('should increment skipped if marking deleted returns false', async () => {
    const candidates = [
      { id: '1', caseId: 'c1', userId: 'u1', storage: { path: 'path/1' } } as DocumentRecord,
    ];
    vi.mocked(mockDocumentRepository.listExpiredForDeletion).mockResolvedValue(candidates);
    vi.mocked(mockDocumentStorage.delete).mockResolvedValue(undefined);
    vi.mocked(mockDocumentRepository.markDeleted).mockResolvedValue(false);

    const result = await service.run(10);

    expect(result).toEqual({ scanned: 1, deleted: 0, skipped: 1, failed: 0 });
  });

  it('should increment failed if storage.delete throws an error', async () => {
    const candidates = [
      { id: '1', caseId: 'c1', userId: 'u1', storage: { path: 'path/1' } } as DocumentRecord,
    ];
    vi.mocked(mockDocumentRepository.listExpiredForDeletion).mockResolvedValue(candidates);
    vi.mocked(mockDocumentStorage.delete).mockRejectedValue(new Error('Storage Error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.run(10);

    expect(result).toEqual({ scanned: 1, deleted: 0, skipped: 0, failed: 1 });
    expect(mockDocumentRepository.markDeleted).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('document_retention_delete_failed', {
      caseId: 'c1',
      documentId: '1',
      message: 'Storage Error',
    });

    consoleErrorSpy.mockRestore();
  });

  it('should increment failed if documents.markDeleted throws an error', async () => {
    const candidates = [
      { id: '1', caseId: 'c1', userId: 'u1', storage: { path: 'path/1' } } as DocumentRecord,
    ];
    vi.mocked(mockDocumentRepository.listExpiredForDeletion).mockResolvedValue(candidates);
    vi.mocked(mockDocumentStorage.delete).mockResolvedValue(undefined);
    vi.mocked(mockDocumentRepository.markDeleted).mockRejectedValue(new Error('DB Error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.run(10);

    expect(result).toEqual({ scanned: 1, deleted: 0, skipped: 0, failed: 1 });
    expect(consoleErrorSpy).toHaveBeenCalledWith('document_retention_delete_failed', {
      caseId: 'c1',
      documentId: '1',
      message: 'DB Error',
    });

    consoleErrorSpy.mockRestore();
  });

  it('should gracefully handle unknown error types in catch block', async () => {
    const candidates = [
      { id: '1', caseId: 'c1', userId: 'u1', storage: { path: 'path/1' } } as DocumentRecord,
    ];
    vi.mocked(mockDocumentRepository.listExpiredForDeletion).mockResolvedValue(candidates);
    vi.mocked(mockDocumentStorage.delete).mockRejectedValue('String Error');

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.run(10);

    expect(result).toEqual({ scanned: 1, deleted: 0, skipped: 0, failed: 1 });
    expect(consoleErrorSpy).toHaveBeenCalledWith('document_retention_delete_failed', {
      caseId: 'c1',
      documentId: '1',
      message: 'unknown',
    });

    consoleErrorSpy.mockRestore();
  });
});
