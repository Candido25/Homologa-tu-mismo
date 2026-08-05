"use client";

import { useState } from "react";
import { COUNTRY_OPTIONS, type DiagnosticObjective, type DiagnosticResult, type DocumentStatusType } from "@/modules/diagnostics/evaluate";
import { saveDiagnosticCase } from "./actions";

type DiagnosticForm = {
  country: string;
  degree: string;
  objective: DiagnosticObjective;
  documentStatus: DocumentStatusType;
};

const initialForm: DiagnosticForm = {
  country: "PE",
  degree: "",
  objective: "work",
  documentStatus: "unknown",
};

export function DiagnosticWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DiagnosticForm>(initialForm);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  function nextStep() {
    setError("");
    if (step === 1) {
      if (!form.degree.trim()) {
        setError("Por favor ingresa el nombre de tu título.");
        return;
      }
    }
    setStep((s) => s + 1);
  }

  function prevStep() {
    setStep((s) => s - 1);
    setError("");
  }

  async function submitDiagnostic() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/diagnostico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "No fue posible procesar el diagnóstico.");
      }

      const nextResult = data as DiagnosticResult;
      setResult(nextResult);
      setStep(4); // Move to results step
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAsCase() {
    if (!result) return;
    setSaving(true);
    setError("");

    try {
      const response = await saveDiagnosticCase(form);

      if (!response.success) {
        if (response.code === "unauthenticated") {
          // Guardamos el estado temporal para recuperarlo al volver
          window.sessionStorage.setItem("homologa-pending-diagnostic", JSON.stringify({ input: form, result }));
          window.location.assign(`/iniciar-sesion?siguiente=${encodeURIComponent("/diagnostico")}`);
          return;
        }
        throw new Error(response.error);
      }

      window.sessionStorage.removeItem("homologa-pending-diagnostic");
      window.location.assign(`/panel/expedientes/${response.caseId}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Ocurrió un error inesperado al guardar el expediente.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-surface rounded-lg shadow-sm border border-line overflow-hidden mt-8">
      {/* Progress Bar */}
      <div className="bg-soft flex">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 ${step >= s ? "bg-brand" : "bg-line"} transition-colors duration-300`}
          />
        ))}
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-danger rounded-md text-sm font-medium">
            {error}
          </div>
        )}

        {/* Step 1: Country and Degree */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-ink mb-6">Paso 1: ¿Dónde y qué estudiaste?</h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="country" className="block font-semibold mb-2 text-ink">País donde obtuviste el título</label>
                <select
                  id="country"
                  className="w-full p-3 border border-line rounded focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                >
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country.code} value={country.code}>{country.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="degree" className="block font-semibold mb-2 text-ink">Nombre exacto de tu título o carrera</label>
                <input
                  id="degree"
                  type="text"
                  className="w-full p-3 border border-line rounded focus:border-brand focus:ring-1 focus:ring-brand outline-none transition"
                  placeholder="Ej: Licenciatura en Enfermería"
                  value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                />
                <p className="text-sm text-muted mt-2">Escríbelo tal como aparece en tu diploma oficial.</p>
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={nextStep} className="px-6 py-2 bg-brand text-white font-semibold rounded hover:bg-brand-dark transition">Siguiente</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Objective */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-ink mb-6">Paso 2: ¿Cuál es tu objetivo en España?</h2>

            <div className="space-y-4">
              {[
                { value: "work", label: "Ejercer mi profesión de forma regulada" },
                { value: "academic", label: "Acreditar el nivel académico (Declaración de Equivalencia)" },
                { value: "study", label: "Continuar estudios (Convalidación universitaria)" },
                { value: "unknown", label: "Todavía no estoy seguro" },
              ].map((obj) => (
                <label key={obj.value} className={`flex items-center p-4 border rounded cursor-pointer transition ${form.objective === obj.value ? 'border-brand bg-brand/5 ring-1 ring-brand' : 'border-line hover:border-brand/50'}`}>
                  <input
                    type="radio"
                    name="objective"
                    value={obj.value}
                    checked={form.objective === obj.value}
                    onChange={(e) => setForm({ ...form, objective: e.target.value as DiagnosticObjective })}
                    className="w-4 h-4 text-brand focus:ring-brand"
                  />
                  <span className="ml-3 font-medium text-ink">{obj.label}</span>
                </label>
              ))}

              <div className="pt-6 flex justify-between">
                <button onClick={prevStep} className="px-6 py-2 bg-surface border border-line text-ink font-semibold rounded hover:bg-soft transition">Atrás</button>
                <button onClick={nextStep} className="px-6 py-2 bg-brand text-white font-semibold rounded hover:bg-brand-dark transition">Siguiente</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Document Status */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-ink mb-6">Paso 3: ¿En qué estado están tus documentos?</h2>

            <div className="space-y-4">
              {[
                { value: "ready", label: "Tengo mi título y plan de estudios apostillados y listos" },
                { value: "missing_apostille", label: "Tengo los documentos, pero me falta la Apostilla de la Haya" },
                { value: "missing_documents", label: "Aún me faltan obtener documentos de la universidad" },
                { value: "unknown", label: "No sé por dónde empezar" },
              ].map((doc) => (
                <label key={doc.value} className={`flex items-center p-4 border rounded cursor-pointer transition ${form.documentStatus === doc.value ? 'border-brand bg-brand/5 ring-1 ring-brand' : 'border-line hover:border-brand/50'}`}>
                  <input
                    type="radio"
                    name="documentStatus"
                    value={doc.value}
                    checked={form.documentStatus === doc.value}
                    onChange={(e) => setForm({ ...form, documentStatus: e.target.value as DocumentStatusType })}
                    className="w-4 h-4 text-brand focus:ring-brand"
                  />
                  <span className="ml-3 font-medium text-ink">{doc.label}</span>
                </label>
              ))}

              <div className="pt-6 flex justify-between">
                <button onClick={prevStep} className="px-6 py-2 bg-surface border border-line text-ink font-semibold rounded hover:bg-soft transition" disabled={loading}>Atrás</button>
                <button
                  onClick={submitDiagnostic}
                  disabled={loading}
                  className="px-6 py-2 bg-brand text-white font-semibold rounded hover:bg-brand-dark transition flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analizando...
                    </>
                  ) : "Ver mi diagnóstico"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 4 && result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <span className="bg-brand/10 text-brand-dark font-bold px-3 py-1 rounded text-xs uppercase tracking-wider mb-3 inline-block">Resultado Preliminar</span>
              <h2 className="text-3xl font-bold text-ink mb-3">{result.route}</h2>
              <p className="text-lg text-muted mb-6">{result.explanation}</p>

              <div className="bg-soft p-4 rounded border border-line mb-6 flex items-center justify-between">
                <span className="font-semibold text-ink">Nivel de confianza:</span>
                <span className="bg-white border border-line px-3 py-1 rounded font-bold text-brand">{result.confidence}</span>
              </div>

              <h3 className="text-xl font-bold text-ink mb-4">Próximos pasos</h3>
              <ul className="space-y-3 mb-8">
                {result.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-ink">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand/10 text-brand-dark flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-line">
                <button onClick={() => setStep(1)} className="px-6 py-3 bg-surface border border-line text-ink font-semibold rounded hover:bg-soft transition text-center" disabled={saving}>
                  Volver a empezar
                </button>
                <button
                  onClick={saveAsCase}
                  disabled={saving}
                  className="px-6 py-3 bg-brand text-white font-semibold rounded hover:bg-brand-dark transition flex-1 text-center flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : "Guardar Diagnóstico y Crear Expediente"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
