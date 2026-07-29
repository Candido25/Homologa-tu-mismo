const placeholderValues = new Set([
  "your-project-url",
  "your-publishable-key",
  "your-service-role-key",
]);

function isUsable(value: string | undefined) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && !placeholderValues.has(normalized);
}

function value(name: string) {
  return process.env[name]?.trim() || "";
}

export type AuthProviderName = "local-test" | "supabase" | "entra";
export type DatabaseProviderName = "postgres" | "supabase";
export type StorageProviderName = "azurite" | "azure-blob" | "supabase";

export function getAuthProviderName(): AuthProviderName {
  const provider = value("AUTH_PROVIDER");
  if (provider === "local-test" || provider === "entra" || provider === "supabase") return provider;
  return isSupabaseConfigured() ? "supabase" : "local-test";
}

export function getDatabaseProviderName(): DatabaseProviderName {
  const provider = value("DATABASE_PROVIDER");
  if (provider === "postgres" || provider === "supabase") return provider;
  return isPortableDatabaseConfigured() ? "postgres" : "supabase";
}

export function getStorageProviderName(): StorageProviderName {
  const provider = value("STORAGE_PROVIDER");
  if (provider === "azurite" || provider === "azure-blob" || provider === "supabase") return provider;
  return process.env.APP_ENV === "local" ? "azurite" : "azure-blob";
}

export function isPortableDatabaseConfigured() {
  return isUsable(process.env.DATABASE_URL);
}

export function getDatabaseUrl() {
  if (!isPortableDatabaseConfigured()) {
    throw new Error("PostgreSQL todavía no está configurado.");
  }
  return process.env.DATABASE_URL!.trim();
}

export function isLocalTestAuthEnabled() {
  return (
    process.env.APP_ENV === "local" &&
    getAuthProviderName() === "local-test" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value("LOCAL_TEST_USER_ID"),
    )
  );
}

export function getLocalTestUserId() {
  if (!isLocalTestAuthEnabled()) {
    throw new Error("La identidad ficticia local no está habilitada.");
  }
  return value("LOCAL_TEST_USER_ID");
}

export function isSupabaseConfigured() {
  return (
    isUsable(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    isUsable(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}

export function getPublicSupabaseConfig() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase todavía no está configurado.");
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!.trim(),
  };
}

export function isApplicationDataConfigured() {
  const provider = getDatabaseProviderName();
  return provider === "postgres" ? isPortableDatabaseConfigured() : isSupabaseConfigured();
}

export function getApplicationUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}
