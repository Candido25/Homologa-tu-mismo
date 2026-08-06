import Link from "next/link";
import { signOut } from "@/app/auth/actions";

interface DashboardHeaderProps {
  displayName: string;
}

export function DashboardHeader({ displayName }: DashboardHeaderProps) {
  return (
    <section className="dashboard-header">
      <div className="container dashboard-heading-row">
        <div>
          <p className="eyebrow">Área privada</p>
          <h1>Hola, {displayName}</h1>
          <p>Organiza tus rutas y continúa desde el último paso registrado.</p>
        </div>
        <div className="dashboard-actions">
          <Link className="button" href="/diagnostico">
            Nuevo diagnóstico
          </Link>
          <form action={signOut}>
            <button className="button button-secondary" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
