import Link from "next/link";

type CaseHeaderProps = {
  degreeName: string;
  route: string | undefined;
  title: string;
};

export function CaseHeader({ degreeName, route, title }: CaseHeaderProps) {
  return (
    <section className="bg-surface border-b border-line py-8 shadow-sm">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-accent font-bold text-sm uppercase tracking-wide mb-1">
            Expediente privado
          </p>
          <h1 className="text-2xl font-bold text-ink mb-1">{degreeName}</h1>
          <p className="text-muted font-medium">{route || title}</p>
        </div>
        <div className="flex gap-3">
          <Link
            className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded font-semibold transition"
            href="/diagnostico"
          >
            Nuevo diagnóstico
          </Link>
          <Link
            className="px-4 py-2 bg-surface hover:bg-soft text-ink border border-line rounded font-semibold transition"
            href="/panel"
          >
            Volver al panel
          </Link>
        </div>
      </div>
    </section>
  );
}
