import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/env";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

export default function RecoverPasswordPage() {
  const configured = isSupabaseConfigured();

  return (
    <>
      <section className="page-header">
        <div className="container auth-hero-grid">
          <div>
            <p className="eyebrow">Área de acceso</p>
            <h1>Recupera el acceso a tu expediente.</h1>
            <p>Sigue los pasos para restablecer tu contraseña de forma segura.</p>
          </div>
        </div>
      </section>

      <section className="section auth-section">
        <div className="container auth-layout">
          <RecoverForm configured={configured} />
        </div>
      </section>
    </>
  );
}
