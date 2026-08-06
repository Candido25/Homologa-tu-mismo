import Link from "next/link";
import type { CaseSummary } from "@/core/cases/case-repository";

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

const procedureLabels: Record<string, string> = {
  homologation: "Homologación probable",
  equivalence: "Equivalencia probable",
  validation: "Convalidación probable",
  professional_recognition: "Reconocimiento profesional",
  undetermined: "Ruta por determinar",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

interface CaseListProps {
  cases: CaseSummary[];
  loadError: boolean;
}

export function CaseList({ cases, loadError }: CaseListProps) {
  return (
    <>
      <div className="dashboard-toolbar">
        <div>
          <h2>Mis expedientes</h2>
          <p>Los estados mostrados son organizativos y no representan información oficial del Ministerio.</p>
        </div>
      </div>

      {loadError ? (
        <div className="notice notice-error" role="alert">
          No pudimos cargar tus expedientes. Comprueba que PostgreSQL esté iniciado y tenga las migraciones.
        </div>
      ) : cases.length > 0 ? (
        <div className="case-grid">
          {cases.map((item) => (
            <Link className="case-card-link" href={`/panel/expedientes/${item.id}`} key={item.id}>
              <article className="case-card">
                <div className="case-card-topline">
                  <span className="result-label">
                    {procedureLabels[item.procedureType] || item.procedureType}
                  </span>
                  <small>{formatDate(item.updatedAt)}</small>
                </div>
                <h3>{item.title}</h3>
                <p>{item.degreeName}</p>
                <div className="case-mini-progress" aria-hidden="true">
                  <span />
                </div>
                <div className="case-status">
                  <span>Estado interno</span>
                  <strong>{statusLabels[item.status] || item.status}</strong>
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state compact-empty-state">
          <h3>Aún no tienes expedientes</h3>
          <p>Completa el diagnóstico inicial para crear tu primera ruta de trabajo.</p>
          <Link className="button" href="/diagnostico">
            Comenzar diagnóstico
          </Link>
        </div>
      )}
    </>
  );
}
