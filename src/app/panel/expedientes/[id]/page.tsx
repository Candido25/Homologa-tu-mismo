import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

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
  if (!isSupabaseConfigured()) redirect("/panel");

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/iniciar-sesion?siguiente=${encodeURIComponent(`/panel/expedientes/${id}`)}`);

  const { data: caseItem, error } = await supabase
    .from("cases")
    .select(
      "id,title,degree_name,objective,procedure_type,status,diagnostic_payload,created_at,updated_at,origin_country_code",
    )
    .eq("id", id)
    .single();

  if (error || !caseItem) notFound();

  const payload = readPayload(caseItem.diagnostic_payload);
  const result = payload.result;

  return (
    <>
      <section className="dashboard-header">
        <div className="container case-detail-header">
          <div>
            <p className="eyebrow">Expediente privado</p>
            <h1>{caseItem.degree_name}</h1>
            <p>{result?.route || caseItem.title}</p>
          </div>
          <Link className="button button-secondary" href="/panel">
            Volver al panel
          </Link>
        </div>
      </section>

      <section className="section dashboard-section">
        <div className="container case-detail-layout">
          <div className="case-detail-main">
            <article className="detail-card">
              <div className="case-card-topline">
                <span className="result-label">Orientación preliminar</span>
                <small>Creado el {formatDate(caseItem.created_at)}</small>
              </div>
              <h2>{result?.route || "Ruta por determinar"}</h2>
              <p>{result?.explanation || "Este expediente todavía necesita completar su diagnóstico."}</p>
              {result?.confidence ? <strong>Nivel de orientación: {result.confidence}</strong> : null}
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
                  <dd>{payload.input?.countryName || caseItem.origin_country_code || "No indicado"}</dd>
                </div>
                <div>
                  <dt>Objetivo</dt>
                  <dd>{caseItem.objective}</dd>
                </div>
                <div>
                  <dt>Última actualización</dt>
                  <dd>{formatDate(caseItem.updated_at)}</dd>
                </div>
              </dl>
            </article>

            <article className="detail-card locked-feature">
              <span className="result-label">Próxima fase</span>
              <h2>Checklist documental</h2>
              <p>Se habilitará después de validar autenticación, RLS y privacidad con usuarios de prueba.</p>
            </article>
          </aside>
        </div>
      </section>
    </>
  );
}
