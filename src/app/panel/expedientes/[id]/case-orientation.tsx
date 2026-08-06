export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

type CaseOrientationProps = {
  createdAt: string;
  route: string | undefined;
  explanation: string | undefined;
  confidence: string | undefined;
};

export function CaseOrientation({
  createdAt,
  route,
  explanation,
  confidence,
}: CaseOrientationProps) {
  return (
    <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
      <div className="flex justify-between items-center mb-4">
        <span className="bg-soft text-ink px-3 py-1 rounded text-sm font-semibold border border-line">
          Orientación preliminar
        </span>
        <small className="text-muted">Creado el {formatDate(createdAt)}</small>
      </div>
      <h2 className="text-xl font-bold text-ink mb-2">
        {route || "Ruta por determinar"}
      </h2>
      <p className="text-muted mb-4">
        {explanation || "Este expediente todavía necesita completar su diagnóstico."}
      </p>
      {confidence ? (
        <div className="inline-flex items-center gap-2 bg-blue/10 text-blue px-3 py-1 rounded-full text-sm font-semibold">
          <span>Nivel de orientación:</span>
          <strong>{confidence}</strong>
        </div>
      ) : null}
    </article>
  );
}
