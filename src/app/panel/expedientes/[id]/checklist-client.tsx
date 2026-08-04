"use client";

import type { DocumentSummary } from "@/core/documents/document-repository";

type ChecklistClientProps = {
  procedure: string;
  documents: DocumentSummary[];
};

export function ChecklistClient({ procedure, documents }: ChecklistClientProps) {
  const isHomologation = procedure === "homologation";

  // Mapping domain checklist requirements to specific document types to track upload status
  const checklistDefinition = isHomologation
    ? [
        { label: "Documento de identidad (Pasaporte/NIE)", types: ["identity_document"] },
        { label: "Título apostillado", types: ["degree", "apostille"] },
        { label: "Certificado académico", types: ["transcript"] },
        { label: "Acreditación de competencia lingüística", types: ["language_certificate"] },
        { label: "Pago de tasas oficiales", types: ["fee_receipt"] },
      ]
    : [
        { label: "Documento de identidad", types: ["identity_document"] },
        { label: "Título universitario legalizado/apostillado", types: ["degree", "apostille"] },
        { label: "Certificado de estudios", types: ["transcript"] },
        { label: "Pago de tasas", types: ["fee_receipt"] },
      ];

  const uploadedTypes = new Set(documents.map(d => d.documentTypeCode));

  return (
    <ul className="space-y-2">
      {checklistDefinition.map((item, i) => {
        // A checklist item is 'checked' if ANY of its corresponding document types has been uploaded.
        // We can refine this logic to require ALL mapped types if necessary.
        // But since this is a general guidance checklist, ANY upload mapped to it is a good indicator of progress.
        const isChecked = item.types.some(type => uploadedTypes.has(type));

        return (
          <li key={i} className="flex items-center gap-2">
            <input
              type="checkbox"
              className={`w-4 h-4 rounded border-line ${isChecked ? 'text-brand bg-brand' : 'text-brand bg-soft'} disabled:opacity-80`}
              checked={isChecked}
              disabled
              readOnly
            />
            <span className={`font-medium ${isChecked ? 'text-muted line-through' : 'text-ink'}`}>
              {item.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
