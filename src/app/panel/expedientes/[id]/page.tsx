import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type {
  DocumentSummary,
  DocumentType,
} from "@/core/documents/document-repository";
import {
  getCaseRepository,
  getCurrentUserProvider,
  getDocumentService,
  isDocumentInterfaceEnabled,
  isPrivateAreaConfigured,
} from "@/lib/application-services";
import { DocumentManager } from "./document-manager";

export const metadata: Metadata = { title: "Mi expediente" };
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type DiagnosticPayload = {
  result?: {
    route?: string;
    confidence?: string;
    explanation?: string;
    nextSteps?: string[];
  };
  input?: {
    countryName?: string;
  };
};

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

function readPayload(value: unknown): DiagnosticPayload {
  return value && typeof value === "object" ? (value as DiagnosticPayload) : {};
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function CasePage({ params }: PageProps) {
  if (!isPrivateAreaConfigured()) redirect("/panel");

  const { id } = await params;
  const user = await getCurrentUserProvider().getCurrentUser();

  if (!user) redirect(`/iniciar-sesion?siguiente=${encodeURIComponent(`/panel/expedientes/${id}`)}`);

  let caseItem;
  try {
    caseItem = await getCaseRepository().getByIdForUser(id, user.id);
  } catch (error) {
    console.error("case_read_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    notFound();
  }

  if (!caseItem) notFound();

  const payload = readPayload(caseItem.diagnosticPayload);
  const result = payload.result;
  const documentInterfaceEnabled = isDocumentInterfaceEnabled();
  let initialDocuments: DocumentSummary[] = [];
  let documentTypes: DocumentType[] = [];

  if (documentInterfaceEnabled) {
    try {
      const documents = getDocumentService();
      [initialDocuments, documentTypes] = await Promise.all([
        documents.list(id, user.id).then((items) => items || []),
        documents.listTypes(),
      ]);
    } catch (error) {
      console.error("document_interface_load_failed", {
        caseId: id,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  return (
    <>
      <section className="dashboard-header">
        <div className="container case-detail-header">
          <div>
            <p className="eyebrow">Expediente privado</p>
            <h1>{caseItem.degreeName}</h1>
            <p>{result?.route || caseItem.title}</p>
          </div>
          <div className="case-header-actions">
            <Link className="button" href="/diagnostico">
              Nuevo diagnóstico
            </Link>
            <Link className="button button-secondary" href="/panel">
              Volver al panel
            </Link>
          </div>
        </div>
      </section>

      <section className="section dashboard-section">
        <div className="container case-detail-layout">
          <div className="case-detail-main">
            <article className="detail-card detail-hero-card">
              <div className="case-card-topline">
                <span className="result-label">Orientación preliminar</span>
                <small>Creado el {formatDate(caseItem.createdAt)}</small>
              </div>
              <h2>{result?.route || "Ruta por determinar"}</h2>
              <p>{result?.explanation || "Este expediente todavía necesita completar su diagnóstico."}</p>
              {result?.confidence ? (
                <div className="confidence-meter compact-confidence">
                  <span>Nivel de orientación</span>
                  <strong>{result.confidence}</strong>
                </div>
              ) : null}
            </article>

            <article className="detail-card">
              <h2>Próximos pasos recomendados</h2>
              {Array.isArray(result?.nextSteps) && result.nextSteps.length > 0 ? (
                <ol className="next-step-list">
                  {result.nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p>Completa nuevamente el diagnóstico para generar una ruta inicial.</p>
              )}
              <p className="disclaimer">
                Estas indicaciones son organizativas y no sustituyen la normativa ni la decisión de la autoridad.
              </p>
            </article>

            {documentInterfaceEnabled && documentTypes.length > 0 ? (
              <DocumentManager
                caseId={id}
                documentTypes={documentTypes}
                initialDocuments={initialDocuments}
              />
            ) : (
              <article className="detail-card">
                <div className="panel-heading">
                  <span className="result-label">Preparación</span>
                  <h2>Checklist documental previsto</h2>
                  <p>
                    La carga permanece desactivada hasta configurar el entorno documental privado.
                  </p>
                </div>
              </article>
            )}
          </div>

          <aside className="case-detail-sidebar">
            <article className="detail-card">
              <h2>Resumen</h2>
              <dl className="summary-list">
                <div>
                  <dt>Estado interno</dt>
                  <dd>{statusLabels[caseItem.status] || caseItem.status}</dd>
                </div>
                <div>
                  <dt>País de origen</dt>
                  <dd>{payload.input?.countryName || caseItem.originCountryCode || "No indicado"}</dd>
                </div>
                <div>
                  <dt>Objetivo</dt>
                  <dd>{caseItem.objective}</dd>
                </div>
                <div>
                  <dt>Última actualización</dt>
                  <dd>{formatDate(caseItem.updatedAt)}</dd>
                </div>
              </dl>
            </article>

            <article className={`detail-card${documentInterfaceEnabled ? "" : " locked-feature"}`}>
              <span className="result-label">
                {documentInterfaceEnabled ? "Canal privado" : "Próxima fase"}
              </span>
              <h2>Archivos privados</h2>
              <p>
                {documentInterfaceEnabled
                  ? "Carga local habilitada para archivos ficticios. El contenido nunca se publica mediante una URL abierta."
                  : "La interfaz se habilitará cuando el almacenamiento privado esté configurado."}
              </p>
            </article>

            <article className="detail-card">
              <h2>Línea de trabajo</h2>
              <ol className="case-timeline">
                <li className="is-complete">Diagnóstico creado</li>
                <li className={initialDocuments.length > 0 ? "is-complete" : ""}>
                  Documentos por organizar
                </li>
                <li>Revisión previa pendiente</li>
                <li>Presentación oficial externa</li>
              </ol>
            </article>
          </aside>
        </div>
      </section>
    </>
  );
}
