import { createHash } from "node:crypto";
import type {
  ReadDocumentResult,
  StoreDocumentInput,
  StoredDocumentObject,
} from "@/core/storage/document-storage";

export const maxDocumentSize = 25 * 1024 * 1024;

export const allowedMimeTypes = new Set<StoredDocumentObject["mimeType"]>([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const documentPathPattern = /^users\/[0-9a-f-]{36}\/cases\/[0-9a-f-]{36}\/documents\/[0-9a-f-]{36}$/i;

function requireUuid(value: string, field: string) {
  if (!uuidPattern.test(value)) throw new Error(`${field} no es un UUID válido.`);
  return value.toLowerCase();
}

export function requireDocumentPath(path: string) {
  if (!documentPathPattern.test(path) || path.includes("..")) {
    throw new Error("Ruta de documento no permitida.");
  }
  return path;
}

export function documentPath(input: StoreDocumentInput) {
  const userId = requireUuid(input.userId, "userId");
  const caseId = requireUuid(input.caseId, "caseId");
  const documentId = requireUuid(input.documentId, "documentId");
  return `users/${userId}/cases/${caseId}/documents/${documentId}`;
}

export function validateContent(input: StoreDocumentInput) {
  if (!allowedMimeTypes.has(input.mimeType)) {
    throw new Error("Tipo MIME no permitido.");
  }
  if (input.content.byteLength === 0) throw new Error("El documento está vacío.");
  if (input.content.byteLength > maxDocumentSize) {
    throw new Error("El documento supera el límite de 25 MB.");
  }
}

export function hash(content: Uint8Array) {
  return createHash("sha256").update(content).digest("hex");
}

export function requireAllowedMimeType(mimeType: string | undefined): ReadDocumentResult["mimeType"] {
  if (!mimeType || !allowedMimeTypes.has(mimeType as ReadDocumentResult["mimeType"])) {
    throw new Error("El objeto almacenado tiene un tipo MIME no permitido.");
  }
  return mimeType as ReadDocumentResult["mimeType"];
}
