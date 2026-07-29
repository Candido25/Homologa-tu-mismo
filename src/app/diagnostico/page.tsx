"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  COUNTRY_OPTIONS,
  type DiagnosticObjective,
  type DiagnosticResult,
} from "@/modules/diagnostics/evaluate";

type DiagnosticForm = {
  country: string;
  degree: string;
  objective: DiagnosticObjective;
};

type PendingDiagnostic = {
  input: DiagnosticForm;
  result: DiagnosticResult;
};

const initialForm: DiagnosticForm = {
  country: "PE",
  degree: "",
  objective: "work",
};

export default function DiagnosticoPage() {
  const [form, setForm] = useState<DiagnosticForm>(initialForm);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      const pending = window.sessionStorage.getItem("homologa-pending-diagnostic");
      if (!pending) return;

      try {
        const parsed = JSON.parse(pending) as PendingDiagnostic;
        if (parsed?.input?.degree && parsed?.result?.route) {
          setForm(parsed.input);
          setResult(parsed.result);
          setMessage("Recuperamos tu diagnóstico. Ya puedes guardarlo en tu panel.");
        }
      } catch {
        window.sessionStorage.removeItem("homologa-pending-diagnostic");
      }
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  function rememberPending(nextResult: DiagnosticResult) {
    const pending: PendingDiagnostic = { input: form, result: nextResult };
    window.sessionStorage.setItem("homologa-pending-diagnostic", JSON.stringify(pending));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
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
      rememberPending(nextResult);
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
    setMessage("");

    try {
      const response = await fetch("/api/expedientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (response.status === 401) {
        rememberPending(result);
        window.location.assign(`/iniciar-sesion?siguiente=${encodeURIComponent("/diagnostico")}`);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error ?? "No fue posible guardar el expediente.");
      }

      window.sessionStorage.removeItem("homologa-pending-diagnostic");
      window.location.assign(`/panel/expedientes/${data.id}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Ocurrió un error inesperado.");
      setSaving(false);
    }
  }

  return (
    <>
      <section className="page-header">
        <div className="container page-header-grid">
          <div>
            <p className="eyebrow">Diagnóstico preliminar</p>
            <h1>Descubre qué ruta puede corresponderte.</h1>
            <p>
              Responde tres preguntas iniciales. Este resultado es orientativo y todavía no sustituye
              la revisión completa del expediente ni la decisión de la autoridad competente.
            </p>
          </div>
          <div className="header-mini-panel" aria-label="Estado del diagnóstico">
            <span>Tiempo estimado</span>
            <strong>2 min</strong>
            <p>Sin documentos reales en esta etapa.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container form-shell">
          <form className="form-card" onSubmit={handleSubmit}>
            <div className="form-card-heading">
              <span className="result-label">Paso 1</span>
              <h2>Datos de tu título</h2>
              <p>La ruta inicial se calcula con información estructurada, no con una conversación libre.</p>
            </div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="country">País donde obtuviste el título</label>
                <select
                  id="country"
                  name="country"
                  required
                  value={form.country}
                  onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
                >
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="objective">¿Cuál es tu objetivo principal?</label>
                <select
                  id="objective"
                  name="objective"
                  required
                  value={form.objective}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      objective: event.target.value as DiagnosticObjective,
                    }))
                  }
                >
                  <option value="work">Ejercer mi profesión en España</option>
                  <option value="study">Continuar o completar estudios</option>
                  <option value="academic">Acreditar el nivel académico del título</option>
                  <option value="unknown">Todavía no estoy seguro</option>
                </select>
              </div>

              <div className="field field-full">
                <label htmlFor="degree">Nombre exacto de tu título o carrera</label>
                <input
                  id="degree"
                  name="degree"
                  required
                  minLength={3}
                  maxLength={180}
                  placeholder="Ejemplo: Ingeniería Civil"
                  value={form.degree}
                  onChange={(event) => setForm((current) => ({ ...current, degree: event.target.value }))}
                />
                <span className="helper">Escríbelo tal como aparece en tu diploma.</span>
              </div>
            </div>

            {error ? <p className="error-message">{error}</p> : null}
            {message ? <p className="notice notice-success">{message}</p> : null}

            <button className="button" type="submit" disabled={loading || saving}>
              {loading ? "Analizando…" : "Obtener orientación preliminar"}
            </button>
          </form>

          <aside className="result-card" aria-live="polite">
            {result ? (
              <>
                <span className="result-label">Resultado preliminar</span>
                <h2>{result.route}</h2>
                <p>{result.explanation}</p>
                <div className="confidence-meter">
                  <span>Nivel de orientación</span>
                  <strong>{result.confidence}</strong>
                </div>
                <h3>Próximos pasos</h3>
                <ul>
                  {result.nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                <button className="button diagnostic-save-button" type="button" onClick={saveAsCase} disabled={saving}>
                  {saving ? "Guardando…" : "Guardar en mi panel"}
                </button>
                <p className="disclaimer">
                  La clasificación definitiva dependerá de la profesión española pretendida, el plan
                  de estudios y la normativa vigente.
                </p>
              </>
            ) : (
              <>
                <span className="result-label">Tu resultado</span>
                <h2>Aquí aparecerá tu ruta inicial.</h2>
                <p>
                  Después podrás guardarla como expediente y continuar el proceso desde tu panel privado.
                </p>
                <div className="result-placeholder-list" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
