"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signInAction, type AuthState } from "@/app/auth/actions";

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
          Iniciando...
        </>
      ) : isEntra ? (
        "Continuar de forma segura"
      ) : (
        "Entrar a mi panel"
      )}
    </button>
  );
}

export function SignInForm({
  isEntra,
  configured,
  siguiente,
  urlError,
  urlMessage,
}: {
  isEntra: boolean;
  configured: boolean;
  siguiente: string;
  urlError?: string;
  urlMessage?: string;
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(signInAction, {
    error: urlError,
    message: urlMessage,
  });

  return (
    <form className="form-card auth-card" action={formAction}>
      <div className="auth-card-heading">
        <span className="result-label">Panel privado</span>
        <h2>Iniciar sesión</h2>
      </div>
      <p className="helper">
        {isEntra
          ? "Accede mediante el portal seguro de identidad."
          : "Utiliza el correo con el que registraste tu expediente."}
      </p>

      {!configured && (
        <div className="notice notice-warning" role="status">
          La identidad de clientes todavía no está configurada para este entorno.
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

      <input type="hidden" name="siguiente" value={siguiente} />

      {!isEntra && (
        <>
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
              autoComplete="current-password"
              required
            />
          </div>

          <div className="flex justify-end mt-[-10px] mb-4">
             <Link href="/recuperar-clave" className="text-sm text-brand hover:underline font-medium">¿Olvidaste tu contraseña?</Link>
          </div>
        </>
      )}

      <SubmitButton isEntra={isEntra} configured={configured} />

      <p className="auth-switch">
        ¿Todavía no tienes una cuenta? <Link href="/crear-cuenta">Crear cuenta</Link>
      </p>
    </form>
  );
}
