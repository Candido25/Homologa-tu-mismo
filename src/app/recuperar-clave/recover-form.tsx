"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { recoverPasswordAction, type AuthState } from "@/app/auth/actions";

function SubmitButton({ configured }: { configured: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="button auth-submit flex justify-center items-center gap-2" type="submit" disabled={!configured || pending}>
      {pending ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Enviando...
        </>
      ) : (
        "Enviar enlace de recuperación"
      )}
    </button>
  );
}

export function RecoverForm({ configured }: { configured: boolean }) {
  const [state, formAction] = useActionState<AuthState, FormData>(recoverPasswordAction, {});

  return (
    <form className="form-card auth-card" action={formAction}>
      <div className="auth-card-heading">
        <span className="result-label">Seguridad</span>
        <h2>Recuperar Contraseña</h2>
      </div>
      <p className="helper">
        Ingresa tu correo electrónico y te enviaremos un enlace para que puedas establecer una nueva contraseña.
      </p>

      {!configured && (
        <div className="notice notice-warning" role="status">
          La recuperación de cuentas no está configurada para este entorno.
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

      <div className="field">
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <SubmitButton configured={configured} />

      <p className="auth-switch">
        ¿Recordaste tu contraseña? <Link href="/iniciar-sesion">Iniciar sesión</Link>
      </p>
    </form>
  );
}
