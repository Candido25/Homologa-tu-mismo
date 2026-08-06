import Link from "next/link";
import { signUp } from "@/app/auth/actions";

type SignUpFormProps = {
  error?: string;
  isEntra: boolean;
  configured: boolean;
};

export function SignUpForm({ error, isEntra, configured }: SignUpFormProps) {
  return (
    <form className="form-card auth-card" action={signUp}>
      <div className="auth-card-heading">
        <span className="result-label">Cuenta privada</span>
        <h2>Datos de acceso</h2>
      </div>
      <p className="helper">
        En esta etapa no te pediremos pasaporte, título ni documentos personales.
      </p>

      {!configured && (
        <div className="notice notice-warning" role="status">
          El registro de clientes todavía no está configurado para este entorno.
        </div>
      )}

      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}

      {!isEntra && (
        <>
          <div className="field">
            <label htmlFor="displayName">Nombre</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              minLength={2}
              autoComplete="name"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              aria-describedby="password-help"
              required
            />
            <span id="password-help" className="helper">
              Utiliza al menos 8 caracteres. Más adelante reforzaremos las reglas y el control de contraseñas filtradas.
            </span>
          </div>
        </>
      )}

      <label className="checkbox-field">
        <input name="terms" type="checkbox" required />
        <span>
          Acepto los términos de uso y la política de privacidad cuando sean publicados antes del lanzamiento.
        </span>
      </label>

      <button className="button auth-submit" type="submit" disabled={!configured}>
        {isEntra ? "Continuar al registro seguro" : "Crear mi cuenta"}
      </button>

      <p className="auth-switch">
        ¿Ya tienes una cuenta? <Link href="/iniciar-sesion">Iniciar sesión</Link>
      </p>
    </form>
  );
}
