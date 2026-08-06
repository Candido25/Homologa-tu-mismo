import { formatDate } from "./case-orientation";

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  diagnosed: "Diagnosticado",
  collecting_documents: "Reuniendo documentos",
  ready_for_review: "Listo para revisión",
  submitted: "Presentado",
  under_review: "En revisión",
  subsanation_required: "Subsanación requerida",
  resolved_favorable: "Resolución favorable",
  resolved_conditional: "Resolución condicionada",
  resolved_unfavorable: "Resolución desfavorable",
  closed: "Cerrado",
};

type CaseSummarySidebarProps = {
  status: string;
  countryName: string | undefined;
  originCountryCode: string | null;
  objective: string;
  updatedAt: string;
};

export function CaseSummarySidebar({
  status,
  countryName,
  originCountryCode,
  objective,
  updatedAt,
}: CaseSummarySidebarProps) {
  return (
    <aside className="w-full lg:w-80 flex flex-col gap-6">
      <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
        <h2 className="text-xl font-bold text-ink mb-4">Resumen</h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-semibold text-muted">Estado interno</dt>
            <dd className="text-ink font-medium">
              {statusLabels[status] || status}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted">
              País de origen
            </dt>
            <dd className="text-ink font-medium">
              {countryName || originCountryCode || "No indicado"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted">Objetivo</dt>
            <dd className="text-ink font-medium">{objective}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted">
              Última actualización
            </dt>
            <dd className="text-ink font-medium">{formatDate(updatedAt)}</dd>
          </div>
        </dl>
      </article>
    </aside>
  );
}
