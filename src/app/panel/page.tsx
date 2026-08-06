import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { CaseSummary } from "@/core/cases/case-repository";
import {
  getCaseRepository,
  getCurrentUserProvider,
  isPrivateAreaConfigured,
} from "@/lib/application-services";
import { DashboardHeader } from "./_components/dashboard-header";
import { DashboardSummary } from "./_components/dashboard-summary";
import { WorkspaceGrid } from "./_components/workspace-grid";
import { CaseList } from "./_components/case-list";

export const metadata: Metadata = {
  title: "Mi panel",
};

export const dynamic = "force-dynamic";

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
      <DashboardHeader displayName={displayName} />
      <section className="section dashboard-section">
        <div className="container">
          <DashboardSummary casesCount={cases.length} hasCases={hasCases} />
          <WorkspaceGrid hasCases={hasCases} firstCaseId={cases[0]?.id} />
          <CaseList cases={cases} loadError={loadError} />
        </div>
      </section>
    </>
  );
}
