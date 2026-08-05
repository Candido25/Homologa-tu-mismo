"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signUpAction, type AuthState } from "@/app/auth/actions";

function SubmitButton({ isEntra, configured }: { isEntra: boolean; configured: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="button auth-submit flex justify-center items-center gap-2" type="submit" disabled={!configured || pending}>
      {pending ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Registrando...
        </>
      ) : isEntra ? (
        "Continuar al registro seguro"
      ) : (
        "Crear mi cuenta"
      )}
    </button>
  );
}

export function SignUpForm({
  isEntra,
  configured,
  urlError,
}: {
  isEntra: boolean;
  configured: boolean;
  urlError?: string;
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(signUpAction, {
    error: urlError,
  });

  return (
    <form className="form-card auth-card" action={formAction}>
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

      {state.message && (
        <div className="notice notice-success" role="status">
          {state.message}
        </div>
      )}

      {state.error && (
        <div className="notice notice-error" role="alert">
          {state.error}
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
          Acepto los <Link href="/terminos" className="text-brand hover:underline">términos de uso</Link> y la <Link href="/privacidad" className="text-brand hover:underline">política de privacidad</Link>.
        </span>
      </label>

      <SubmitButton isEntra={isEntra} configured={configured} />

      <p className="auth-switch">
        ¿Ya tienes una cuenta? <Link href="/iniciar-sesion">Iniciar sesión</Link>
      </p>
    </form>
  );
}
