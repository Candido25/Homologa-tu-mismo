import type { Metadata } from "next";
import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <>
      <section className="page-header">
        <div className="container narrow-container">
          <p className="eyebrow">Empieza tu ruta</p>
          <h1>Crea tu cuenta</h1>
          <p>Guarda tus datos iniciales y construye tu expediente paso a paso.</p>
        </div>
      </section>

      <section className="section auth-section">
        <div className="container auth-layout">
          <form className="form-card auth-card" action={signUp}>
            <h2>Datos de acceso</h2>
            <p className="helper">
              En esta etapa no te pediremos pasaporte, título ni documentos personales.
            </p>

            {!configured && (
              <div className="notice notice-warning" role="status">
                El registro está construido, pero todavía falta conectar el proyecto de Supabase.
              </div>
            )}

            {params.error && (
              <div className="notice notice-error" role="alert">
                {params.error}
              </div>
            )}

            <div className="field">
              <label htmlFor="displayName">Nombre</label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                minLength={2}
                autoComplete="name"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </div>

            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                aria-describedby="password-help"
                required
              />
              <span id="password-help" className="helper">
                Utiliza al menos 8 caracteres. Más adelante reforzaremos las reglas y el control de contraseñas filtradas.
              </span>
            </div>

            <label className="checkbox-field">
              <input name="terms" type="checkbox" required />
              <span>
                Acepto los términos de uso y la política de privacidad cuando sean publicados antes del lanzamiento.
              </span>
            </label>

            <button className="button auth-submit" type="submit" disabled={!configured}>
              Crear mi cuenta
            </button>

            <p className="auth-switch">
              ¿Ya tienes una cuenta? <Link href="/iniciar-sesion">Iniciar sesión</Link>
            </p>
          </form>

          <aside className="auth-aside">
            <span className="result-label">Primero, lo esencial</span>
            <h2>Una incorporación progresiva y segura</h2>
            <p>
              Empezaremos con identidad básica, diagnóstico y expedientes. La carga documental se habilitará
              únicamente después de probar políticas RLS, almacenamiento privado, retención y eliminación.
            </p>
            <ul className="check-list">
              <li>Correo verificado antes de acceder.</li>
              <li>Datos mínimos para crear la cuenta.</li>
              <li>Documentos sensibles desactivados en esta fase.</li>
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
