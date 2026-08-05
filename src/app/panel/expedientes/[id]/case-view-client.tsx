"use client";

import { useState } from "react";
import type { DocumentSummary, DocumentType } from "@/core/documents/document-repository";
import { DocumentManager } from "./document-manager";
import { RequirementsClient } from "./requirements-client";

type CaseViewClientProps = {
  caseId: string;
  procedure: string;
  initialDocuments: DocumentSummary[];
  documentTypes: DocumentType[];
  documentInterfaceEnabled: boolean;
};

export function CaseViewClient({
  caseId,
  procedure,
  initialDocuments,
  documentTypes,
  documentInterfaceEnabled,
}: CaseViewClientProps) {
  const [documents, setDocuments] = useState<DocumentSummary[]>(initialDocuments);

  function handleDocumentsChange(updatedDocuments: DocumentSummary[]) {
    setDocuments(updatedDocuments);
  }

  return (
    <>
      <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
        <h2 className="text-xl font-bold text-ink mb-4">Línea de Progreso</h2>
        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-line">
            <div
              style={{ width: documents.length > 0 ? "50%" : "25%" }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand transition-all duration-500"
            ></div>
          </div>
          <ul className="flex justify-between text-xs font-semibold text-muted">
            <li className="text-brand">Borrador</li>
            <li className={documents.length > 0 ? "text-brand" : ""}>Documentos</li>
            <li>Revisión</li>
            <li>Presentación</li>
          </ul>
        </div>
      </article>

      <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
        <h2 className="text-xl font-bold text-ink mb-4">Requisitos y Plazos ({procedure})</h2>
        <RequirementsClient procedure={procedure} documents={documents} />
      </article>

      {documentInterfaceEnabled && documentTypes.length > 0 ? (
        <DocumentManager
          caseId={caseId}
          documentTypes={documentTypes}
          initialDocuments={documents}
          onChange={handleDocumentsChange}
        />
      ) : (
        <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
          <span className="bg-soft text-ink px-3 py-1 rounded text-sm font-semibold border border-line inline-block mb-3">Preparación</span>
          <h2 className="text-xl font-bold text-ink mb-2">Checklist documental previsto</h2>
          <p className="text-muted">
            La carga permanece desactivada hasta configurar el entorno documental privado.
          </p>
        </article>
      )}
    </>
  );
}
