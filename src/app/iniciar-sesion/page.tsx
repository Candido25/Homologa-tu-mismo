import type { Metadata } from "next";
import { getAuthProviderName, isAuthProviderConfigured } from "@/lib/env";
import { SignInForm } from "./sign-in-form";

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
  const provider = getAuthProviderName();
  const configured = isAuthProviderConfigured();
  const isEntra = provider === "entra";

  return (
    <>
      <section className="page-header">
        <div className="container auth-hero-grid">
          <div>
            <p className="eyebrow">Área privada</p>
            <h1>Continúa con tu expediente.</h1>
            <p>Accede para guardar tu diagnóstico, organizar documentos y consultar tus próximos pasos.</p>
          </div>
          <div className="auth-status-card">
            <span>Acceso</span>
            <strong>Privado</strong>
            <p>Estados internos, no información oficial del Ministerio.</p>
          </div>
        </div>
      </section>

      <section className="section auth-section">
        <div className="container auth-layout">
          <SignInForm
            isEntra={isEntra}
            configured={configured}
            siguiente={params.siguiente || "/panel"}
            urlError={params.error}
            urlMessage={params.mensaje}
          />

          <aside className="auth-aside">
            <span className="result-label">Tu información, bajo control</span>
            <h2>Una cuenta para cada trámite</h2>
            <p>
              El panel mantendrá separados tus expedientes, requisitos y avances. Los documentos reales
              seguirán desactivados hasta completar las pruebas de seguridad y privacidad.
            </p>
            <ul className="check-list">
              <li>Sesiones seguras mediante cookies.</li>
              <li>Autorización por propietario desde el servidor.</li>
              <li>Sin claves administrativas en el navegador.</li>
            </ul>
            <div className="auth-security-strip">
              <span>Cookies</span>
              <span>Aislamiento</span>
              <span>Servidor</span>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
