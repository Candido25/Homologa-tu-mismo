import type { Metadata } from "next";
import { FAQAccordion } from "./faq-accordion";
import { ChatAssistant } from "./chat-assistant";

export const metadata: Metadata = {
  title: "Asistencia y Preguntas Frecuentes - Homologación de Títulos",
  description: "Encuentra respuestas a dudas frecuentes sobre requisitos, tiempos de espera, apostillas y traducciones para homologar y validar tu título en España.",
  openGraph: {
    title: "Asistencia y FAQ | Homologa Tú Mismo",
    description: "Resuelve tus dudas sobre la homologación de títulos extranjeros en España con nuestro asistente virtual y preguntas frecuentes.",
  }
};

export default function AsistenciaPage() {
  return (
    <div className="bg-soft min-h-screen pb-12">
      <section className="bg-surface border-b border-line py-12 shadow-sm text-center">
        <div className="container mx-auto px-6">
          <p className="text-accent font-bold text-sm uppercase tracking-wide mb-2">Soporte y Orientación</p>
          <h1 className="text-3xl md:text-4xl font-bold text-ink mb-4">Asistencia Interactiva y FAQ</h1>
          <p className="text-muted font-medium max-w-2xl mx-auto">
            Resuelve tus dudas más comunes de forma inmediata o consulta a nuestro asistente virtual para recibir orientación sobre tu caso particular.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-2xl font-bold text-ink mb-2">Preguntas Frecuentes</h2>
            <p className="text-muted mb-6">Información esencial sobre los procesos administrativos en España.</p>
            <FAQAccordion />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-2xl font-bold text-ink mb-2">Asistente Virtual</h2>
            <p className="text-muted mb-6">Describe tu caso y recibe orientación estructurada.</p>
            <ChatAssistant />
          </div>
        </div>
      </section>
    </div>
  );
}
