"use client";

import { FormEvent, useState } from "react";

type DiagnosticResult = {
  route: string;
  confidence: string;
  explanation: string;
  nextSteps: string[];
};

export default function DiagnosticoPage() {
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      country: form.get("country"),
      degree: form.get("degree"),
      objective: form.get("objective"),
    };

    try {
      const response = await fetch("/api/diagnostico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "No fue posible procesar el diagnóstico.");
      }

      setResult(data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="page-header">
        <div className="container">
          <p className="eyebrow">Diagnóstico preliminar</p>
          <h1>Descubre qué ruta puede corresponderte.</h1>
          <p>
            Responde tres preguntas iniciales. Este resultado es orientativo y todavía no sustituye
            la revisión completa del expediente ni la decisión de la autoridad competente.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container form-shell">
          <form className="form-card" onSubmit={handleSubmit}>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="country">País donde obtuviste el título</label>
                <select id="country" name="country" required defaultValue="Perú">
                  <option>Perú</option>
                  <option>Chile</option>
                  <option>Colombia</option>
                  <option>Ecuador</option>
                  <option>Argentina</option>
                  <option>Bolivia</option>
                  <option>Venezuela</option>
                  <option>México</option>
                  <option>Otro país</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="objective">¿Cuál es tu objetivo principal?</label>
                <select id="objective" name="objective" required defaultValue="work">
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
                  placeholder="Ejemplo: Ingeniería Civil"
                />
                <span className="helper">Escríbelo tal como aparece en tu diploma.</span>
              </div>
            </div>

            {error ? <p className="error-message">{error}</p> : null}

            <button className="button" type="submit" disabled={loading}>
              {loading ? "Analizando…" : "Obtener orientación preliminar"}
            </button>
          </form>

          <aside className="result-card" aria-live="polite">
            {result ? (
              <>
                <span className="result-label">Resultado preliminar</span>
                <h2>{result.route}</h2>
                <p>{result.explanation}</p>
                <strong>Nivel de orientación: {result.confidence}</strong>
                <h3>Próximos pasos</h3>
                <ul>
                  {result.nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
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
                  En las siguientes fases podrás guardar el diagnóstico, crear un expediente y revisar
                  cada documento.
                </p>
              </>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
