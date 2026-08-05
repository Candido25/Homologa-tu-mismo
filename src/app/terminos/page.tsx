import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Servicio",
  description: "Términos y condiciones de uso de Homologa Tú Mismo.",
};

export default function TermsPage() {
  return (
    <div className="bg-soft min-h-screen pb-12">
      <section className="bg-surface border-b border-line py-12 shadow-sm text-center">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-ink mb-4">Términos de Servicio</h1>
          <p className="text-muted font-medium">Última actualización: Agosto de 2026</p>
        </div>
      </section>

      <section className="container mx-auto px-6 mt-12 max-w-4xl">
        <article className="bg-surface p-8 rounded-lg shadow-sm border border-line prose max-w-none text-ink">
          <h2>1. Introducción</h2>
          <p>Bienvenido a Homologa Tú Mismo. Estos términos de servicio regulan el uso de nuestra plataforma. Al acceder y utilizar nuestros servicios, aceptas estar sujeto a estas condiciones.</p>

          <h2>2. Independencia del Servicio</h2>
          <p>Homologa Tú Mismo es una plataforma privada e independiente. <strong>No pertenecemos ni estamos asociados con el Gobierno de España</strong>, el Ministerio de Ciencia, Innovación y Universidades, ni ningún otro organismo público. Nuestro servicio es puramente orientativo y organizativo para facilitar la preparación de expedientes de homologación y equivalencia.</p>

          <h2>3. Responsabilidad del Usuario</h2>
          <p>La información, diagnóstico y recomendaciones proporcionadas en la plataforma son de carácter informativo. El usuario es responsable de verificar los requisitos legales vigentes y de la veracidad de los documentos que presente ante las autoridades oficiales. No garantizamos la aprobación de ningún trámite.</p>

          <h2>4. Privacidad y Seguridad</h2>
          <p>El manejo de tu información personal y documentación se rige por nuestra Política de Privacidad. Garantizamos la confidencialidad de tus archivos mediante almacenamiento privado y controles de acceso basados en roles.</p>
        </article>
      </section>
    </div>
  );
}
