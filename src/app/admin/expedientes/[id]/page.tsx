import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminCaseRepository,
} from "@/lib/application-services";

export const metadata: Metadata = { title: "Revisión de Expediente" };
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminCaseViewPage({ params }: PageProps) {
  const { id } = await params;

  let caseItem;
  try {
    caseItem = await getAdminCaseRepository().getById(id);
  } catch (error) {
    console.error("admin_case_read_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    notFound();
  }

  if (!caseItem) notFound();

  return (
    <div className="container mx-auto px-6 pb-12">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">Revisión: {caseItem.title}</h1>
          <p className="text-muted">
            Usuario: {caseItem.userName || "No especificado"} ({caseItem.userEmail || "No especificado"})
          </p>
        </div>
        <Link href="/admin/expedientes" className="px-4 py-2 bg-surface border border-line text-ink rounded font-semibold hover:bg-soft transition-colors">
          Volver a la lista
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
            <h2 className="text-xl font-bold text-ink mb-4">Documentos Subidos</h2>
            <p className="text-muted text-sm mb-4">
              En una implementación completa, aquí se listarían los documentos subidos por el usuario, permitiendo al asesor marcarlos como APROBADO o REQUIERE SUBSANACIÓN.
            </p>
            <div className="p-4 bg-soft border border-dashed border-line rounded text-center">
              Módulo de revisión documental en desarrollo.
            </div>
          </article>

          <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
            <h2 className="text-xl font-bold text-ink mb-4">Bitácora y Cambios de Etapa</h2>
            <p className="text-muted text-sm mb-4">
              Desde aquí el asesor podrá cambiar la etapa oficial del expediente (ej. pasar a EN REVISION MINISTERIO) y añadir notas a la bitácora del usuario.
            </p>
            <div className="p-4 bg-soft border border-dashed border-line rounded text-center">
              Módulo de bitácora administrativa en desarrollo.
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
            <h2 className="text-xl font-bold text-ink mb-4">Detalles del Expediente</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-semibold text-muted">ID</dt>
                <dd className="text-ink font-medium text-xs break-all">{caseItem.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Nivel de Servicio</dt>
                <dd className="text-ink font-medium">
                  {caseItem.tier === "PREMIUM" ? (
                    <span className="bg-brand/10 text-brand-dark px-2 py-1 rounded text-xs uppercase font-bold">Premium</span>
                  ) : (
                    <span className="bg-soft text-muted px-2 py-1 rounded text-xs uppercase font-bold">Free</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Etapa Actual</dt>
                <dd className="text-ink font-medium">{caseItem.currentStage}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Estado Interno</dt>
                <dd className="text-ink font-medium">{caseItem.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Trámite</dt>
                <dd className="text-ink font-medium uppercase">{caseItem.procedureType}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Creado el</dt>
                <dd className="text-ink font-medium">{formatDate(caseItem.createdAt)}</dd>
              </div>
            </dl>
          </article>
        </div>
      </div>
    </div>
  );
}
