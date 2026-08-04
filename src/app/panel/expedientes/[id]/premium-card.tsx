"use client";

import { useState } from "react";
import { createPolarCheckout } from "./actions";

type PremiumCardProps = {
  caseId: string;
  isPremium: boolean;
};

export function PremiumCard({ caseId, isPremium }: PremiumCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoading(true);
    setError("");

    try {
      const response = await createPolarCheckout(caseId);
      if (!response.success) {
        throw new Error(response.error);
      }
      // Redirect to Polar checkout
      window.location.href = response.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar el pago.");
      setLoading(false);
    }
  }

  if (isPremium) {
    return (
      <article className="bg-gradient-to-r from-brand to-brand-dark p-6 rounded-lg shadow-sm border border-line text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Premium Activo</span>
        </div>
        <h2 className="text-xl font-bold mb-2">Revisión Profesional Desbloqueada</h2>
        <p className="text-white/80 text-sm">
          Tu expediente ahora cuenta con acceso a revisión por especialistas y guías avanzadas para asegurar el éxito de tu trámite.
        </p>
      </article>
    );
  }

  return (
    <article className="bg-surface p-6 rounded-lg shadow-sm border border-line relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-10 -mt-10" />
      <h2 className="text-xl font-bold text-ink mb-2">Desbloquear Revisión Profesional</h2>
      <p className="text-muted text-sm mb-6">
        Obtén una evaluación detallada de tus documentos por un especialista en homologaciones para evitar rechazos y retrasos en tu solicitud oficial.
      </p>

      <div className="flex flex-col gap-3">
        <ul className="text-sm text-ink space-y-2 mb-2">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Revisión manual de cada documento
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Guía paso a paso avanzada
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Plantillas de oficios oficiales
          </li>
        </ul>

        {error && <p className="text-danger text-sm font-medium">{error}</p>}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-ink text-white font-semibold py-3 rounded-md hover:bg-ink/90 transition-colors disabled:opacity-70 flex justify-center items-center"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Iniciando pago...
            </span>
          ) : (
            "Actualizar a Premium"
          )}
        </button>
      </div>
    </article>
  );
}
