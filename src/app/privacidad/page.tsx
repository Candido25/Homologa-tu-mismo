import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad y manejo de datos de Homologa Tú Mismo.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-soft min-h-screen pb-12">
      <section className="bg-surface border-b border-line py-12 shadow-sm text-center">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-ink mb-4">Política de Privacidad</h1>
          <p className="text-muted font-medium">Última actualización: Agosto de 2026</p>
        </div>
      </section>

      <section className="container mx-auto px-6 mt-12 max-w-4xl">
        <article className="bg-surface p-8 rounded-lg shadow-sm border border-line prose max-w-none text-ink">
          <h2>1. Recopilación de Datos</h2>
          <p>Recopilamos únicamente la información necesaria para brindarte el servicio de organización de expedientes: nombre, correo electrónico, país de origen, nombre de tu título, y los documentos que decidas subir voluntariamente a tu panel privado.</p>

          <h2>2. Almacenamiento Seguro</h2>
          <p>Tus documentos y expedientes se almacenan utilizando infraestructura en la nube con altos estándares de seguridad (Supabase). Se aplican políticas de <i>Row Level Security</i> para asegurar que solo tú y los asesores autorizados (en caso de contratar revisión) tengan acceso a tu información.</p>

          <h2>3. Retención y Eliminación</h2>
          <p>Mantenemos tus documentos solo por el tiempo necesario para cumplir con el propósito del servicio o hasta que el usuario decida eliminarlos. Contamos con rutinas automáticas de limpieza para documentos vencidos o de cuentas cerradas de acuerdo con la legislación vigente en España y Europa (RGPD).</p>

          <h2>4. Terceros</h2>
          <p>No vendemos, comercializamos ni transferimos tus datos de identificación personal a terceros. Podemos compartir información con proveedores de servicios de confianza (como servicios de hosting o pagos) únicamente bajo acuerdos de confidencialidad para operar la plataforma.</p>
        </article>
      </section>
    </div>
  );
}
