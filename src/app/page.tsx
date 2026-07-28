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

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Plataforma de orientación documental</p>
            <h1>Homologa tu título en España tú mismo.</h1>
            <p>
              Identifica tu trámite, revisa tus documentos y prepara tu expediente paso a paso,
              sin depender de intermediarios costosos.
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
          </div>

          <aside className="preview-card" aria-label="Vista previa del expediente">
            <div className="progress-row">
              <span>Preparación del expediente</span>
              <strong>62 %</strong>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span />
            </div>
            <div className="document-list">
              <div className="document-item">
                <span>Documento de identidad</span>
                <span className="status-ok">Completo</span>
              </div>
              <div className="document-item">
                <span>Título universitario</span>
                <span className="status-ok">Completo</span>
              </div>
              <div className="document-item">
                <span>Certificado académico</span>
                <span className="status-pending">Revisar horas</span>
              </div>
              <div className="document-item">
                <span>Apostilla</span>
                <span className="status-pending">Pendiente</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section" id="como-funciona">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Cómo funciona</p>
            <h2>Tú haces el trámite. Nosotros te damos una ruta clara.</h2>
            <p>
              La aplicación combinará reglas verificadas, tutoriales, organización documental y
              asistencia inteligente.
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
          <div className="cta-panel">
            <div>
              <h2>Empieza con un diagnóstico preliminar.</h2>
              <p>La fase cero ya puede evaluar tu objetivo y mostrar una ruta inicial.</p>
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
