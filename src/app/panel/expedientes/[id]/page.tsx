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

  const procedure = caseItem.procedureType;
  const isHomologation = procedure === "homologation";
  const checklist = isHomologation
    ? ["Documento de identidad (Pasaporte/NIE)", "Título apostillado", "Certificado académico", "Acreditación de competencia lingüística", "Pago de tasas oficiales"]
    : ["Documento de identidad", "Título universitario legalizado/apostillado", "Certificado de estudios", "Pago de tasas"];

  return (
    <div className="bg-soft min-h-screen pb-12">
      <section className="bg-surface border-b border-line py-8 shadow-sm">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-accent font-bold text-sm uppercase tracking-wide mb-1">Expediente privado</p>
            <h1 className="text-2xl font-bold text-ink mb-1">{caseItem.degreeName}</h1>
            <p className="text-muted font-medium">{result?.route || caseItem.title}</p>
          </div>
          <div className="flex gap-3">
            <Link className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded font-semibold transition" href="/diagnostico">
              Nuevo diagnóstico
            </Link>
            <Link className="px-4 py-2 bg-surface hover:bg-soft text-ink border border-line rounded font-semibold transition" href="/panel">
              Volver al panel
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 mt-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-6">
          <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
            <div className="flex justify-between items-center mb-4">
              <span className="bg-soft text-ink px-3 py-1 rounded text-sm font-semibold border border-line">
                Orientación preliminar
              </span>
              <small className="text-muted">Creado el {formatDate(caseItem.createdAt)}</small>
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">{result?.route || "Ruta por determinar"}</h2>
            <p className="text-muted mb-4">{result?.explanation || "Este expediente todavía necesita completar su diagnóstico."}</p>
            {result?.confidence ? (
              <div className="inline-flex items-center gap-2 bg-blue/10 text-blue px-3 py-1 rounded-full text-sm font-semibold">
                <span>Nivel de orientación:</span>
                <strong>{result.confidence}</strong>
              </div>
            ) : null}
          </article>

          <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
            <h2 className="text-xl font-bold text-ink mb-4">Línea de Progreso</h2>
            <div className="relative">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-line">
                <div style={{ width: initialDocuments.length > 0 ? "50%" : "25%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand transition-all duration-500"></div>
              </div>
              <ul className="flex justify-between text-xs font-semibold text-muted">
                <li className="text-brand">Borrador</li>
                <li className={initialDocuments.length > 0 ? "text-brand" : ""}>Documentos</li>
                <li>Revisión</li>
                <li>Presentación</li>
              </ul>
            </div>
          </article>

          <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
            <h2 className="text-xl font-bold text-ink mb-4">Checklist Dinámico ({procedure})</h2>
            <ul className="space-y-2">
              {checklist.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-brand bg-soft border-line rounded" disabled />
                  <span className="text-ink font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </article>

          {documentInterfaceEnabled && documentTypes.length > 0 ? (
            <DocumentManager
              caseId={id}
              documentTypes={documentTypes}
              initialDocuments={initialDocuments}
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
        </div>

        <aside className="w-full lg:w-80 flex flex-col gap-6">
          <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
            <h2 className="text-xl font-bold text-ink mb-4">Resumen</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-semibold text-muted">Estado interno</dt>
                <dd className="text-ink font-medium">{statusLabels[caseItem.status] || caseItem.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">País de origen</dt>
                <dd className="text-ink font-medium">{payload.input?.countryName || caseItem.originCountryCode || "No indicado"}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Objetivo</dt>
                <dd className="text-ink font-medium">{caseItem.objective}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Última actualización</dt>
                <dd className="text-ink font-medium">{formatDate(caseItem.updatedAt)}</dd>
              </div>
            </dl>
          </article>
        </aside>
      </section>
    </div>
  );
}
