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

  return (
    <>
      <section className="dashboard-header">
        <div className="container dashboard-heading-row">
          <div>
            <p className="eyebrow">Área privada</p>
            <h1>Hola, {displayName}</h1>
            <p>Organiza tus rutas y continúa desde el último paso registrado.</p>
          </div>
          <form action={signOut}>
            <button className="button button-secondary" type="submit">
              Cerrar sesión
            </button>
          </form>
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
              <strong>{cases.length ? "Abrir expediente" : "Diagnóstico"}</strong>
              <small>{cases.length ? "continúa tu ruta" : "define primero tu ruta"}</small>
            </article>
          </div>

          <div className="dashboard-toolbar">
            <div>
              <h2>Mis expedientes</h2>
              <p>Los estados mostrados son organizativos y no representan información oficial del Ministerio.</p>
            </div>
            <Link className="button" href="/diagnostico">
              Nuevo diagnóstico
            </Link>
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
