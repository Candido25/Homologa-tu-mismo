import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mi panel",
};

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="section">
        <div className="container empty-state">
          <span className="result-label">Configuración pendiente</span>
          <h1>El panel ya está construido</h1>
          <p>
            Falta crear el proyecto Supabase europeo y registrar sus variables en Render. No se ha habilitado
            ninguna carga de documentos reales.
          </p>
          <Link className="button" href="/">
            Volver al inicio
          </Link>
        </div>
      </section>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/iniciar-sesion?siguiente=/panel");
  }

  const { data: cases, error } = await supabase
    .from("cases")
    .select("id,title,degree_name,procedure_type,status,updated_at")
    .order("updated_at", { ascending: false })
    .limit(6);

  const displayName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] || "usuario";

  return (
    <>
      <section className="dashboard-header">
        <div className="container dashboard-heading-row">
          <div>
            <p className="eyebrow">Área privada</p>
            <h1>Hola, {displayName}</h1>
            <p>Organiza tus rutas y continúa desde el último paso registrado.</p>
          </div>
          <form action={signOut}>
            <button className="button button-secondary" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </section>

      <section className="section dashboard-section">
        <div className="container">
          <div className="dashboard-summary">
            <article className="metric-card">
              <span>Expedientes</span>
              <strong>{cases?.length || 0}</strong>
              <small>hasta 6 recientes</small>
            </article>
            <article className="metric-card">
              <span>Documentos</span>
              <strong>0</strong>
              <small>carga aún desactivada</small>
            </article>
            <article className="metric-card">
              <span>Próximo paso</span>
              <strong>Diagnóstico</strong>
              <small>define primero tu ruta</small>
            </article>
          </div>

          <div className="dashboard-toolbar">
            <div>
              <h2>Mis expedientes</h2>
              <p>Los estados mostrados son organizativos y no representan información oficial del Ministerio.</p>
            </div>
            <Link className="button" href="/diagnostico">
              Crear diagnóstico
            </Link>
          </div>

          {error ? (
            <div className="notice notice-error" role="alert">
              No pudimos cargar tus expedientes. Comprueba que las migraciones de Supabase estén aplicadas.
            </div>
          ) : cases && cases.length > 0 ? (
            <div className="case-grid">
              {cases.map((item) => (
                <article className="case-card" key={item.id}>
                  <div className="case-card-topline">
                    <span className="result-label">{item.procedure_type}</span>
                    <small>{formatDate(item.updated_at)}</small>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.degree_name}</p>
                  <div className="case-status">
                    <span>Estado interno</span>
                    <strong>{item.status}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty-state">
              <h3>Aún no tienes expedientes</h3>
              <p>Completa el diagnóstico inicial para crear tu primera ruta de trabajo.</p>
              <Link className="button" href="/diagnostico">
                Comenzar diagnóstico
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
