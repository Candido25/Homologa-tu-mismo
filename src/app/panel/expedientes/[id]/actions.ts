"use server";

import { revalidatePath } from "next/cache";
import {
  hasValidDocumentSignature,
  maxDocumentSize,
  parseAllowedMimeType,
} from "@/adapters/storage/document-storage-rules";
import {
  getCurrentUserProvider,
  getDocumentService,
  isDocumentFlowConfigured,
} from "@/lib/application-services";
import type { DocumentSummary } from "@/core/documents/document-repository";

export type UploadActionResponse =
  | { success: true; document: DocumentSummary }
  | { success: false; error: string; code?: "unauthenticated" | "invalid_input" | "not_configured" | "not_found" };

export type DeleteActionResponse =
  | { success: true }
  | { success: false; error: string; code?: "unauthenticated" | "not_configured" | "not_found" };

export async function uploadCaseDocument(caseId: string, formData: FormData): Promise<UploadActionResponse> {
  if (!isDocumentFlowConfigured()) {
    return { success: false, error: "El flujo documental privado todavía no está configurado.", code: "not_configured" };
  }

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return { success: false, error: "Debes iniciar sesión.", code: "unauthenticated" };
  }

  const file = formData.get("archivo");
  const documentTypeCode = formData.get("tipoDocumento");
  if (!(file instanceof File) || typeof documentTypeCode !== "string") {
    return { success: false, error: "Selecciona un archivo y un tipo documental.", code: "invalid_input" };
  }

  if (!/^[a-z][a-z0-9_]{1,63}$/.test(documentTypeCode)) {
    return { success: false, error: "El tipo documental no es válido.", code: "invalid_input" };
  }

  const mimeType = parseAllowedMimeType(file.type);
  if (!mimeType) {
    return { success: false, error: "Solo se permiten archivos PDF, JPEG y PNG.", code: "invalid_input" };
  }

  if (file.size === 0) {
    return { success: false, error: "El documento está vacío.", code: "invalid_input" };
  }

  if (file.size > maxDocumentSize) {
    return { success: false, error: "El documento supera el límite de 25 MB.", code: "invalid_input" };
  }

  const content = new Uint8Array(await file.arrayBuffer());
  if (!hasValidDocumentSignature(content, mimeType)) {
    return { success: false, error: "El contenido del archivo no coincide con su tipo declarado.", code: "invalid_input" };
  }

  try {
    const result = await getDocumentService().upload({
      caseId,
      userId: user.id,
      documentTypeCode,
      filename: file.name,
      mimeType,
      content,
    });

    if (!result.ok) {
      const error = result.reason === "case_not_found" ? "Expediente no encontrado." : "Tipo documental no encontrado.";
      return { success: false, error, code: result.reason === "case_not_found" ? "not_found" : "invalid_input" };
    }

    revalidatePath(`/panel/expedientes/${caseId}`);
    return { success: true, document: result.document };
  } catch (error) {
    console.error("document_upload_failed", {
      caseId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return { success: false, error: "No pudimos guardar el documento. Intenta nuevamente." };
  }
}

export async function deleteCaseDocument(caseId: string, documentId: string): Promise<DeleteActionResponse> {
  if (!isDocumentFlowConfigured()) {
    return { success: false, error: "El flujo documental privado todavía no está configurado.", code: "not_configured" };
  }

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return { success: false, error: "Debes iniciar sesión.", code: "unauthenticated" };
  }

  try {
    const deleted = await getDocumentService().delete(documentId, caseId, user.id);
    if (!deleted) {
      return { success: false, error: "Documento no encontrado.", code: "not_found" };
    }

    revalidatePath(`/panel/expedientes/${caseId}`);
    return { success: true };
  } catch (error) {
    console.error("document_delete_failed", {
      caseId,
      documentId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return { success: false, error: "No pudimos eliminar el documento." };
  }
}

export async function getCaseDocuments(caseId: string): Promise<DocumentSummary[]> {
  if (!isDocumentFlowConfigured()) return [];

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) return [];

  try {
    const documents = await getDocumentService().list(caseId, user.id);
    return documents || [];
  } catch (error) {
    console.error("document_list_failed", {
      caseId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return [];
  }
}
