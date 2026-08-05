import type { Metadata } from "next";
import { getAuthProviderName, isAuthProviderConfigured } from "@/lib/env";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const provider = getAuthProviderName();
  const configured = isAuthProviderConfigured();
  const isEntra = provider === "entra";

  return (
    <>
      <section className="page-header">
        <div className="container auth-hero-grid">
          <div>
            <p className="eyebrow">Empieza tu ruta</p>
            <h1>Crea tu cuenta de preparación.</h1>
            <p>Guarda tu diagnóstico y construye un expediente privado antes de presentar cualquier trámite oficial.</p>
          </div>
          <div className="auth-status-card">
            <span>Etapa actual</span>
            <strong>Validación</strong>
            <p>Sin documentos reales ni pagos en esta fase.</p>
          </div>
        </div>
      </section>

      <section className="section auth-section">
        <div className="container auth-layout">
          <SignUpForm isEntra={isEntra} configured={configured} urlError={params.error} />

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
            <div className="auth-security-strip">
              <span>Identidad</span>
              <span>Diagnóstico</span>
              <span>Expediente</span>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
