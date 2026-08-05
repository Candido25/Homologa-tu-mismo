import type { Metadata } from "next";
import Link from "next/link";
import { getAdminCaseRepository } from "@/lib/application-services";

export const metadata: Metadata = { title: "Panel de Administración" };
export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminDashboardPage() {
  const cases = await getAdminCaseRepository().listAllCases(50);

  return (
    <div className="container mx-auto px-6 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Gestión de Expedientes</h1>
        <p className="text-muted mt-2">Visión general de los trámites activos en la plataforma.</p>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-line overflow-hidden">
        <div className="p-4 border-b border-line bg-soft/50 flex justify-between items-center">
          <h2 className="font-semibold text-ink">Expedientes Recientes ({cases.length})</h2>
          {/* Future implementation: Add filters here */}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-soft text-muted uppercase font-bold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Expediente</th>
                <th className="px-6 py-4">Etapa Actual</th>
                <th className="px-6 py-4">Nivel</th>
                <th className="px-6 py-4">Actualizado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted">
                    No hay expedientes registrados.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.id} className="hover:bg-soft/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink">{c.userName || "Sin nombre"}</div>
                      <div className="text-muted text-xs">{c.userEmail || "Sin correo"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink truncate max-w-[200px]" title={c.degreeName}>{c.degreeName}</div>
                      <div className="text-muted text-xs uppercase">{c.procedureType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue/10 text-blue font-semibold px-2 py-1 rounded text-xs">
                        {c.currentStage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.tier === "PREMIUM" ? (
                        <span className="bg-brand/10 text-brand-dark font-bold px-2 py-1 rounded text-xs uppercase tracking-wider">Premium</span>
                      ) : (
                        <span className="text-muted font-medium px-2 py-1 rounded text-xs uppercase tracking-wider">Free</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {formatDate(c.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/expedientes/${c.id}`}
                        className="text-brand font-medium hover:underline"
                      >
                        Revisar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
