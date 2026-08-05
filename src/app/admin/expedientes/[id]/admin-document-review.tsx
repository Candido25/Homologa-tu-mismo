"use client";

import { useState } from "react";
import type { DocumentSummary } from "@/core/documents/document-repository";
import type { CaseRequirement, RequirementStatus } from "@/core/cases/requirement-repository";
import { adminUpdateRequirementStatus } from "./admin-actions";

type AdminDocumentReviewProps = {
  caseId: string;
  userId: string;
  documents: DocumentSummary[];
  requirements: CaseRequirement[];
};

export function AdminDocumentReview({ caseId, userId, documents, requirements }: AdminDocumentReviewProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleStatusChange(documentTypeCode: string, newStatus: RequirementStatus) {
    setLoadingId(documentTypeCode);
    setError("");

    const response = await adminUpdateRequirementStatus(caseId, userId, documentTypeCode, newStatus);

    if (!response.success) {
      setError(response.error || "Error al actualizar estado");
    }

    setLoadingId(null);
  }

  // Group documents by type
  const docsByType = new Map<string, DocumentSummary[]>();
  for (const doc of documents) {
    if (!docsByType.has(doc.documentTypeCode)) {
      docsByType.set(doc.documentTypeCode, []);
    }
    docsByType.get(doc.documentTypeCode)!.push(doc);
  }

  if (documents.length === 0) {
    return (
      <div className="p-4 bg-soft border border-dashed border-line rounded text-center text-muted">
        El usuario aún no ha subido ningún documento.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-danger text-sm font-medium">{error}</p>}

      <div className="grid gap-4">
        {Array.from(docsByType.entries()).map(([typeCode, docs]) => {
          const req = requirements.find(r => r.documentTypeCode === typeCode);
          const currentStatus = req?.status || "uploaded";
          const latestDoc = docs[0]; // Assuming they are sorted by newest first

          return (
            <div key={typeCode} className="border border-line rounded-lg p-4 bg-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3 pb-3 border-b border-line">
                <div>
                  <h3 className="font-bold text-ink">{latestDoc.documentTypeName}</h3>
                  <p className="text-sm text-muted">{docs.length} versión(es) subida(s)</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted">Estado:</span>
                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(typeCode, e.target.value as RequirementStatus)}
                    disabled={loadingId === typeCode}
                    className={`text-sm font-bold border rounded px-2 py-1 outline-none ${
                      currentStatus === "approved" ? "bg-green-50 text-green-700 border-green-200" :
                      currentStatus === "needs_action" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-blue/10 text-blue border-blue/20"
                    }`}
                  >
                    <option value="uploaded">Pendiente Revisión</option>
                    <option value="approved">Aprobado</option>
                    <option value="needs_action">Requiere Subsanación</option>
                  </select>
                  {loadingId === typeCode && <span className="text-xs text-muted animate-pulse">Guardando...</span>}
                </div>
              </div>

              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="flex justify-between items-center bg-soft p-2 rounded text-sm">
                    <span className="truncate flex-1 font-medium text-ink mr-4" title={doc.originalFilename}>
                      {doc.originalFilename} (v{doc.version})
                    </span>
                    <a
                      href={`/api/expedientes/${caseId}/documentos/${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline flex-shrink-0"
                    >
                      Descargar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
