export type AuthenticatedUser = {
  /** Identificador interno de Homologa Tú Mismo, no el subject del proveedor. */
  id: string;
  email: string | null;
  displayName: string | null;
  provider: string;
  issuer: string;
  subject: string;
};

/**
 * Frontera de lectura de la identidad actual.
 *
 * Las capas de negocio no deben importar Supabase, MSAL ni SDK de Entra.
 * Cada proveedor deberá adaptar su sesión a este contrato.
 */
export interface CurrentUserProvider {
  getCurrentUser(): Promise<AuthenticatedUser | null>;
}
