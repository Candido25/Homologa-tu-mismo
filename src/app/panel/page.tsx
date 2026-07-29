import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import type { CaseSummary } from "@/core/cases/case-repository";
import {
  getCaseRepository,
  getCurrentUserProvider,
  isPrivateAreaConfigured,
} from "@/lib/application-services";

export const metadata: Metadata = {
  title: "Mi panel",
};

export const dynamic = "force-dynamic";

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

const workspaceSteps = [
  "Diagnóstico guardado",
  "Checklist documental",
  "Revisión previa",
  "Presentación oficial",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function DashboardPage() {
  if (!isPrivateAreaConfigured()) {
    return (
      <section className="section">
        <div className="container empty-state">
          <span className="result-label">Configuración pendiente</span>
          <h1>El panel ya está construido</h1>
          <p>
            Falta iniciar el entorno local portable o configurar los proveedores del entorno. La carga de
            documentos reales continúa desactivada.
          </p>
          <Link className="button" href="/">
            Volver al inicio
          </Link>
        </div>
      </section>
    );
  }

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) redirect("/iniciar-sesion?siguiente=/panel");

  let cases: CaseSummary[] = [];
  let loadError = false;

  try {
    cases = await getCaseRepository().listRecentByUser(user.id, 6);
  } catch (error) {
    loadError = true;
    console.error("case_list_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "usuario";
  const hasCases = cases.length > 0;

  return (
    <>
      <section className="dashboard-header">
        <div className="container dashboard-heading-row">
          <div>
            <p className="eyebrow">Área privada</p>
            <h1>Hola, {displayName}</h1>
            <p>Organiza tus rutas y continúa desde el último paso registrado.</p>
          </div>
          <div className="dashboard-actions">
            <Link className="button" href="/diagnostico">
              Nuevo diagnóstico
            </Link>
            <form action={signOut}>
              <button className="button button-secondary" type="submit">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="section dashboard-section">
        <div className="container">
          <div className="dashboard-summary">
            <article className="metric-card">
              <span>Expedientes</span>
              <strong>{cases.length}</strong>
              <small>hasta 6 recientes</small>
            </article>
            <article className="metric-card">
              <span>Documentos</span>
              <strong>0</strong>
              <small>carga aún desactivada</small>
            </article>
            <article className="metric-card">
              <span>Próximo paso</span>
              <strong>{hasCases ? "Abrir expediente" : "Diagnóstico"}</strong>
              <small>{hasCases ? "continúa tu ruta" : "define primero tu ruta"}</small>
            </article>
          </div>

          <div className="workspace-grid">
            <section className="workspace-panel">
              <div className="panel-heading">
                <span className="result-label">Ruta de trabajo</span>
                <h2>Avance del expediente</h2>
                <p>Estados internos para ordenar tu preparación antes de ir al portal oficial.</p>
              </div>
              <ol className="workspace-steps">
                {workspaceSteps.map((step, index) => (
                  <li className={index === 0 && hasCases ? "is-complete" : ""} key={step}>
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                  </li>
                ))}
              </ol>
            </section>

            <aside className="workspace-panel next-action-panel">
              <span className="result-label">Siguiente acción</span>
              <h2>{hasCases ? "Revisar expediente reciente" : "Crear primera ruta"}</h2>
              <p>
                {hasCases
                  ? "Abre tu expediente más reciente y revisa los pasos recomendados."
                  : "Completa el diagnóstico preliminar para guardar una ruta inicial."}
              </p>
              <Link className="button" href={hasCases ? `/panel/expedientes/${cases[0].id}` : "/diagnostico"}>
                {hasCases ? "Continuar expediente" : "Comenzar diagnóstico"}
              </Link>
            </aside>
          </div>

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
        </div>
      </section>
    </>
  );
}
