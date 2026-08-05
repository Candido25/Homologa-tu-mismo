"use client";

import { useTransition, useState } from "react";
import type { DocumentSummary } from "@/core/documents/document-repository";
import type { CaseRequirement } from "@/core/cases/requirement-repository";
import { toggleRequirementStatusAction } from "./requirements-actions";

type RequirementsClientProps = {
  caseId: string;
  procedure: string;
  documents: DocumentSummary[];
  requirements: CaseRequirement[];
};

export function RequirementsClient({ caseId, procedure, documents, requirements }: RequirementsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticRequirements, setOptimisticRequirements] = useState(requirements);

  const isHomologation = procedure === "homologation";

  // Mapping domain checklist requirements to specific document types to track upload status
  const checklistDefinition = isHomologation
    ? [
        { label: "Documento de identidad (Pasaporte/NIE)", type: "identity_document" },
        { label: "Título oficial original", type: "degree" },
        { label: "Certificación académica (con asignaturas, calificaciones y carga horaria)", type: "transcript" },
        { label: "Acreditación de competencia lingüística", type: "language_certificate" },
        { label: "Pago de la tasa vigente (Modelo 790-107 - 166,50 €)", type: "fee_receipt" },
      ]
    : [
        { label: "Documento de identidad (Pasaporte/NIE)", type: "identity_document" },
        { label: "Título oficial original", type: "degree" },
        { label: "Certificación académica", type: "transcript" },
        { label: "Pago de la tasa vigente (Modelo 790-107 - 166,50 €)", type: "fee_receipt" },
      ];

  const uploadedTypes = new Set(documents.map(d => d.documentTypeCode));

  function handleToggle(documentTypeCode: string, isChecked: boolean, hasUploadedFile: boolean) {
    if (hasUploadedFile) return; // Cannot uncheck if a file is physically uploaded

    const newStatus = isChecked ? "missing" : "uploaded";

    // Optimistic update
    setOptimisticRequirements(current => {
      const existing = current.find(r => r.documentTypeCode === documentTypeCode);
      if (existing) {
        return current.map(r => r.documentTypeCode === documentTypeCode ? { ...r, status: newStatus } : r);
      }
      return [...current, {
        id: "temp-id",
        caseId,
        documentTypeCode,
        required: true,
        status: newStatus,
        reason: null,
        dueDate: null,
        updatedAt: new Date().toISOString()
      }];
    });

    startTransition(async () => {
      await toggleRequirementStatusAction(caseId, documentTypeCode, newStatus);
    });
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <h3 className="font-bold text-ink mb-3 text-lg border-b border-line pb-2 flex justify-between items-center">
          Checklist de Documentos Obligatorios
          {isPending && <span className="text-xs font-normal text-muted animate-pulse">Sincronizando...</span>}
        </h3>
        <ul className="space-y-3">
          {checklistDefinition.map((item, i) => {
            const hasUploadedFile = uploadedTypes.has(item.type);
            const req = optimisticRequirements.find(r => r.documentTypeCode === item.type);
            const isChecked = hasUploadedFile || (req?.status === "uploaded" || req?.status === "approved");

            return (
              <li key={i} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className={`mt-1 w-4 h-4 rounded border-line cursor-pointer ${isChecked ? 'text-brand bg-brand' : 'text-brand bg-soft'} disabled:opacity-50`}
                  checked={isChecked}
                  onChange={() => handleToggle(item.type, isChecked, hasUploadedFile)}
                  disabled={hasUploadedFile || isPending}
                />
                <span className={`font-medium ${isChecked ? 'text-muted line-through' : 'text-ink'}`}>
                  {item.label}
                </span>
                {hasUploadedFile && (
                  <span className="ml-auto text-xs font-semibold bg-brand/10 text-brand-dark px-2 py-0.5 rounded">
                    Archivo subido
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-blue/5 border border-blue/20 p-4 rounded-lg">
        <h3 className="font-bold text-blue flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Aclaración Clave de Validez
        </h3>
        <p className="text-sm text-ink mb-2">
          Para que los documentos extranjeros tengan validez en España, deben cumplir dos requisitos fundamentales:
        </p>
        <ul className="list-disc list-inside text-sm text-ink ml-4 space-y-1">
          <li><strong>Apostilla de la Haya:</strong> Si tu país es firmante del Convenio de la Haya, el documento debe llevar la Apostilla. En caso contrario, requiere legalización diplomática.</li>
          <li><strong>Traducción Jurada:</strong> Si el documento original no está en castellano, es obligatoria una traducción realizada por un traductor jurado reconocido en España.</li>
        </ul>
      </div>

      <div className="bg-accent/10 border border-accent/30 p-4 rounded-lg">
        <h3 className="font-bold text-accent flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Expectativas y Plazos de Tramitación
        </h3>
        <p className="text-sm text-ink">
          Las solicitudes se presentan a través de la Sede Electrónica del Ministerio de Ciencia, Innovación y Universidades (portal Valida-TE). <br/><br/>
          <strong>Atención:</strong> Aunque el plazo legal máximo para resolver es de 6 meses, los <strong>tiempos reales suelen ser significativamente mayores</strong> y varían en función de la profesión solicitada y la carga de trabajo de la administración en ese momento. Te recomendamos iniciar el trámite con la mayor antelación posible.
        </p>
      </div>
    </div>
  );
}
