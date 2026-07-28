import type { Metadata } from "next";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/env";
import { signIn } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

type PageProps = {
  searchParams: Promise<{
    error?: string;
    mensaje?: string;
    siguiente?: string;
  }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <>
      <section className="page-header">
        <div className="container narrow-container">
          <p className="eyebrow">Área privada</p>
          <h1>Continúa con tu expediente</h1>
          <p>Accede para guardar tu diagnóstico, organizar documentos y consultar tus próximos pasos.</p>
        </div>
      </section>

      <section className="section auth-section">
        <div className="container auth-layout">
          <form className="form-card auth-card" action={signIn}>
            <h2>Iniciar sesión</h2>
            <p className="helper">Utiliza el correo con el que registraste tu expediente.</p>

            {!configured && (
              <div className="notice notice-warning" role="status">
                El módulo está preparado, pero todavía falta conectar el proyecto de Supabase.
              </div>
            )}

            {params.mensaje && (
              <div className="notice notice-success" role="status">
                {params.mensaje}
              </div>
            )}

            {params.error && (
              <div className="notice notice-error" role="alert">
                {params.error}
              </div>
            )}

            <input type="hidden" name="siguiente" value={params.siguiente || "/panel"} />

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
                autoComplete="current-password"
                required
              />
            </div>

            <button className="button auth-submit" type="submit" disabled={!configured}>
              Entrar a mi panel
            </button>

            <p className="auth-switch">
              ¿Todavía no tienes una cuenta? <Link href="/crear-cuenta">Crear cuenta</Link>
            </p>
          </form>

          <aside className="auth-aside">
            <span className="result-label">Tu información, bajo control</span>
            <h2>Una cuenta para cada trámite</h2>
            <p>
              El panel mantendrá separados tus expedientes, requisitos y avances. Los documentos reales
              seguirán desactivados hasta completar las pruebas de seguridad y privacidad.
            </p>
            <ul className="check-list">
              <li>Sesiones seguras mediante cookies.</li>
              <li>Acceso aislado por usuario con RLS.</li>
              <li>Sin claves administrativas en el navegador.</li>
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
