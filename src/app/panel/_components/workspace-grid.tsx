import Link from "next/link";

const workspaceSteps = [
  "Diagnóstico guardado",
  "Checklist documental",
  "Revisión previa",
  "Presentación oficial",
];

interface WorkspaceGridProps {
  hasCases: boolean;
  firstCaseId?: string;
}

export function WorkspaceGrid({ hasCases, firstCaseId }: WorkspaceGridProps) {
  return (
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
        <Link className="button" href={hasCases && firstCaseId ? `/panel/expedientes/${firstCaseId}` : "/diagnostico"}>
          {hasCases ? "Continuar expediente" : "Comenzar diagnóstico"}
        </Link>
      </aside>
    </div>
  );
}
