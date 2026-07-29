import type { StoredDocumentObject } from "@/core/storage/document-storage";

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "reviewed_ok"
  | "needs_action"
  | "rejected"
  | "expired"
  | "deleted";

export type DocumentDeletionSource = "user" | "retention";

export type DocumentType = {
  code: string;
  name: string;
  sensitivity: "public" | "personal" | "high";
};

export type DocumentSummary = {
  id: string;
  caseId: string;
  documentTypeCode: string;
  documentTypeName: string;
  originalFilename: string;
  mimeType: StoredDocumentObject["mimeType"];
  sizeBytes: number;
  status: DocumentStatus;
  version: number;
  retentionUntil: string | null;
  uploadedAt: string;
};

export type DocumentRecord = DocumentSummary & {
  userId: string;
  storage: StoredDocumentObject;
};

export type CreateDocumentRecordInput = {
  id: string;
  caseId: string;
  userId: string;
  documentType: DocumentType;
  originalFilename: string;
  storage: StoredDocumentObject;
  retentionUntil: string | null;
};

/**
 * Persistencia de metadatos documentales.
 *
 * Todas las lecturas reciben caseId y userId para mantener la autorización
 * dentro de la consulta, incluso si se manipulan las rutas HTTP.
 */
export interface DocumentRepository {
  getActiveDocumentType(code: string): Promise<DocumentType | null>;
  listActiveDocumentTypes(): Promise<DocumentType[]>;
  listByCaseForUser(caseId: string, userId: string): Promise<DocumentSummary[]>;
  listExpiredForDeletion(limit: number): Promise<DocumentRecord[]>;
  getByIdForUser(
    documentId: string,
    caseId: string,
    userId: string,
  ): Promise<DocumentRecord | null>;
  create(input: CreateDocumentRecordInput): Promise<DocumentSummary>;
  markDeleted(
    documentId: string,
    caseId: string,
    userId: string,
    source: DocumentDeletionSource,
  ): Promise<boolean>;
}
