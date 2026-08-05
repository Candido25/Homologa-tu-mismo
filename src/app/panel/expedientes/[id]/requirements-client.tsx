"use client";

import type { DocumentSummary } from "@/core/documents/document-repository";

type RequirementsClientProps = {
  procedure: string;
  documents: DocumentSummary[];
};

export function RequirementsClient({ procedure, documents }: RequirementsClientProps) {
  const isHomologation = procedure === "homologation";

  // Mapping domain checklist requirements to specific document types to track upload status
  const checklistDefinition = isHomologation
    ? [
        { label: "Documento de identidad (Pasaporte/NIE)", types: ["identity_document"] },
        { label: "Título oficial original", types: ["degree"] },
        { label: "Certificación académica (con asignaturas, calificaciones y carga horaria)", types: ["transcript"] },
        { label: "Acreditación de competencia lingüística", types: ["language_certificate"] },
        { label: "Pago de la tasa vigente (Modelo 790-107 - 166,50 €)", types: ["fee_receipt"] },
      ]
    : [
        { label: "Documento de identidad (Pasaporte/NIE)", types: ["identity_document"] },
        { label: "Título oficial original", types: ["degree"] },
        { label: "Certificación académica", types: ["transcript"] },
        { label: "Pago de la tasa vigente (Modelo 790-107 - 166,50 €)", types: ["fee_receipt"] },
      ];

  const uploadedTypes = new Set(documents.map(d => d.documentTypeCode));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-ink mb-3 text-lg border-b border-line pb-2">Checklist de Documentos Obligatorios</h3>
        <ul className="space-y-3">
          {checklistDefinition.map((item, i) => {
            const isChecked = item.types.some(type => uploadedTypes.has(type));
            return (
              <li key={i} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className={`mt-1 w-4 h-4 rounded border-line ${isChecked ? 'text-brand bg-brand' : 'text-brand bg-soft'} disabled:opacity-80`}
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
