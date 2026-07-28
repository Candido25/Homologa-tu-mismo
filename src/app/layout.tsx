import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "./auth-dashboard.css";

export const metadata: Metadata = {
  title: {
    default: "Homologa Tú Mismo",
    template: "%s | Homologa Tú Mismo",
  },
  description:
    "Tu título, tu trámite, nuestra guía. Prepara tu expediente de homologación en España paso a paso.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link className="brand" href="/" aria-label="Homologa Tú Mismo, inicio">
              <span className="brand-mark">HT</span>
              <span>
                <strong>Homologa Tú Mismo</strong>
                <small>Tu título, tu trámite, nuestra guía.</small>
              </span>
            </Link>

            <nav aria-label="Navegación principal">
              <Link href="/#como-funciona">Cómo funciona</Link>
              <Link href="/diagnostico">Diagnóstico</Link>
              <Link href="/iniciar-sesion">Iniciar sesión</Link>
              <Link className="button button-small" href="/panel">
                Mi panel
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="container footer-grid">
            <div>
              <strong>Homologa Tú Mismo</strong>
              <p>Una plataforma privada e independiente para preparar tu expediente.</p>
            </div>
            <p className="legal-note">
              No pertenecemos al Gobierno de España ni garantizamos la aprobación de solicitudes.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
