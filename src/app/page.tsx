import Link from "next/link";

const steps = [
  {
    title: "Identifica tu ruta",
    text: "Responde preguntas sencillas para conocer si tu caso apunta a homologación, equivalencia o convalidación.",
  },
  {
    title: "Prepara tu expediente",
    text: "Organiza los documentos requeridos y detecta información pendiente antes de presentar la solicitud.",
  },
  {
    title: "Realiza el trámite",
    text: "Accede al portal oficial con una guía clara y conserva el control de todo el procedimiento.",
  },
];

const trustPoints = [
  "Reglas trazables",
  "Documentos privados",
  "Sin intermediarios",
  "Control del expediente",
];

const checklist = [
  { label: "Diagnóstico preliminar", state: "Listo" },
  { label: "Documentos obligatorios", state: "En revisión" },
  { label: "Apostilla y legalización", state: "Pendiente" },
  { label: "Presentación oficial", state: "Próximo" },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Orientación documental para España</p>
            <h1>Homologa tu título en España tú mismo.</h1>
            <p>
              Convierte un trámite confuso en una ruta clara: diagnóstico, checklist documental y
              seguimiento privado de tu expediente.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/diagnostico">
                Descubrir qué trámite necesito
              </Link>
              <a className="button button-secondary" href="#como-funciona">
                Ver cómo funciona
              </a>
            </div>
            <p className="trust-line">
              Información clara, fuentes oficiales y decisiones siempre bajo tu control.
            </p>
            <div className="trust-strip" aria-label="Principios de la plataforma">
              {trustPoints.map((point) => (
                <span key={point}>{point}</span>
              ))}
            </div>
          </div>

          <aside className="preview-card product-preview" aria-label="Vista previa del expediente">
            <div className="preview-topbar">
              <span />
              <span />
              <span />
            </div>
            <div className="progress-row">
              <span>Expediente de homologación</span>
              <strong>62 %</strong>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span />
            </div>
            <div className="route-panel">
              <span className="result-label">Ruta probable</span>
              <h2>Homologación</h2>
              <p>Profesión regulada. Requiere preparar documentación académica y legalización.</p>
            </div>
            <div className="document-list">
              {checklist.map((item) => (
                <div className="document-item" key={item.label}>
                  <span>{item.label}</span>
                  <span className={item.state === "Listo" ? "status-ok" : "status-pending"}>
                    {item.state}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container proof-grid">
          <div>
            <span className="proof-value">3</span>
            <p>preguntas para iniciar una ruta preliminar</p>
          </div>
          <div>
            <span className="proof-value">25 MB</span>
            <p>límite técnico previsto por documento ficticio</p>
          </div>
          <div>
            <span className="proof-value">0</span>
            <p>documentos reales durante esta etapa de validación</p>
          </div>
        </div>
      </section>

      <section className="section" id="como-funciona">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Cómo funciona</p>
            <h2>Tú haces el trámite. La plataforma ordena el camino.</h2>
            <p>
              Primero usamos datos estructurados y reglas verificables. Luego la explicación te
              ayuda a entender qué preparar y qué revisar.
            </p>
          </div>

          <div className="card-grid">
            {steps.map((step, index) => (
              <article className="info-card" key={step.title}>
                <span className="step-number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <div className="process-band">
            <div>
              <p className="eyebrow">Flujo privado</p>
              <h2>Del diagnóstico al expediente, sin perder el control.</h2>
            </div>
            <ol className="timeline-list">
              <li>
                <strong>Diagnóstico</strong>
                <span>Define si tu caso apunta a homologación, equivalencia o convalidación.</span>
              </li>
              <li>
                <strong>Checklist</strong>
                <span>Ordena identidad, título, certificado académico, apostilla y observaciones.</span>
              </li>
              <li>
                <strong>Seguimiento</strong>
                <span>Guarda el avance interno y separa lo oficial de lo organizativo.</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-panel">
            <div>
              <h2>Empieza con un diagnóstico preliminar.</h2>
              <p>Guarda tu ruta como expediente y continúa cuando tengas la documentación lista.</p>
            </div>
            <Link className="button" href="/diagnostico">
              Comenzar ahora
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
