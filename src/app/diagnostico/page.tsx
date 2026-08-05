import type { Metadata } from "next";
import { DiagnosticWizard } from "./diagnostic-wizard";

export const metadata: Metadata = {
  title: "Diagnóstico Preliminar",
};

export default function DiagnosticoPageWrapper() {
  return (
    <div className="bg-soft min-h-screen pb-12">
      <DiagnosticWizard />
    </div>
  );
}
