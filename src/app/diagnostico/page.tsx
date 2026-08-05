import type { Metadata } from "next";
import { DiagnosticWizard } from "./diagnostic-wizard";

export const metadata: Metadata = {
  title: "Diagnóstico Preliminar para Homologar tu Título en España",
  description: "Realiza tu diagnóstico preliminar en 3 pasos para descubrir qué trámite te corresponde (Homologación, Equivalencia o Convalidación) y qué documentos necesitas.",
  openGraph: {
    title: "Diagnóstico Preliminar | Homologa Tú Mismo",
    description: "Descubre tu ruta de homologación o equivalencia para España en minutos.",
  }
};

export default function DiagnosticoPageWrapper() {
  return (
    <div className="bg-soft min-h-screen pb-12">
      <DiagnosticWizard />
    </div>
  );
}
