interface DashboardSummaryProps {
  casesCount: number;
  hasCases: boolean;
}

export function DashboardSummary({ casesCount, hasCases }: DashboardSummaryProps) {
  return (
    <div className="dashboard-summary">
      <article className="metric-card">
        <span>Expedientes</span>
        <strong>{casesCount}</strong>
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
  );
}
