export type StoredDocumentObject = {
  provider: string;
  container: string;
  path: string;
  sizeBytes: number;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  sha256: string;
};

export type StoreDocumentInput = {
  userId: string;
  caseId: string;
  documentId: string;
  filename: string;
  mimeType: StoredDocumentObject["mimeType"];
  content: Uint8Array;
};

export type ReadDocumentResult = {
  content: Uint8Array;
  mimeType: StoredDocumentObject["mimeType"];
  sizeBytes: number;
};

/**
 * Frontera de almacenamiento de documentos privados.
 *
 * La implementación Azure usará Blob Storage y la implementación local Azurite.
 * Ninguna capa de negocio debe construir URLs públicas ni usar claves de cuenta.
 */
export interface DocumentStorage {
  store(input: StoreDocumentInput): Promise<StoredDocumentObject>;
  read(object: StoredDocumentObject): Promise<ReadDocumentResult>;
  delete(object: StoredDocumentObject): Promise<void>;
}
