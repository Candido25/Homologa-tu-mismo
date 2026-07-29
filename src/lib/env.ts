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

export function isEntraConfigured() {
  return (
    getAuthProviderName() === "entra" &&
    isUsable(process.env.ENTRA_TENANT_ID) &&
    isUsable(process.env.ENTRA_TENANT_SUBDOMAIN) &&
    isUsable(process.env.ENTRA_CLIENT_ID) &&
    isUsable(process.env.ENTRA_CLIENT_SECRET) &&
    isPortableDatabaseConfigured()
  );
}

export function getAuthSessionCookieName() {
  return process.env.APP_ENV === "local" ? "homologa-session" : "__Host-homologa-session";
}

export function isAuthProviderConfigured() {
  const provider = getAuthProviderName();
  if (provider === "local-test") return isLocalTestAuthEnabled();
  if (provider === "entra") return isEntraConfigured();
  return isSupabaseConfigured();
}

export function getLocalTestUserId() {
  if (!isLocalTestAuthEnabled()) {
    throw new Error("La identidad ficticia local no está habilitada.");
  }
  return value("LOCAL_TEST_USER_ID");
}

export function isAzuriteConfigured() {
  return (
    process.env.APP_ENV === "local" &&
    getStorageProviderName() === "azurite" &&
    isUsable(process.env.AZURE_STORAGE_CONNECTION_STRING)
  );
}

export function getAzuriteConfig() {
  if (!isAzuriteConfigured()) {
    throw new Error("Azurite todavía no está configurado para el entorno local.");
  }

  return {
    connectionString: value("AZURE_STORAGE_CONNECTION_STRING"),
    caseDocumentsContainer: value("AZURE_STORAGE_CASE_DOCUMENTS_CONTAINER") || "case-documents",
    generatedReportsContainer:
      value("AZURE_STORAGE_GENERATED_REPORTS_CONTAINER") || "generated-reports",
  };
}

export function isAzureBlobConfigured() {
  return getStorageProviderName() === "azure-blob" && isUsable(process.env.AZURE_STORAGE_ACCOUNT_NAME);
}

export function getAzureBlobConfig() {
  if (!isAzureBlobConfigured()) {
    throw new Error("Azure Blob Storage todavía no está configurado.");
  }

  return {
    accountName: value("AZURE_STORAGE_ACCOUNT_NAME"),
    caseDocumentsContainer: value("AZURE_STORAGE_CASE_DOCUMENTS_CONTAINER") || "case-documents",
    generatedReportsContainer:
      value("AZURE_STORAGE_GENERATED_REPORTS_CONTAINER") || "generated-reports",
  };
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

export function getDocumentRetentionDays() {
  const configured = Number.parseInt(value("DOCUMENT_RETENTION_DAYS"), 10);
  if (!Number.isFinite(configured)) return 30;
  return Math.min(Math.max(configured, 1), 3650);
}

export function isDocumentUploadUiEnabled() {
  return value("DOCUMENT_UPLOAD_UI_ENABLED").toLowerCase() === "true";
}

const localRetentionJobToken = "local-retention-job-test-only";

export function getDocumentRetentionJobToken() {
  const token = value("DOCUMENT_RETENTION_JOB_TOKEN");
  if (token.length < 24 || token.startsWith("@Microsoft.KeyVault(")) {
    throw new Error("El token del proceso de retención no está configurado.");
  }
  if (process.env.APP_ENV !== "local" && token === localRetentionJobToken) {
    throw new Error("El token local de retención no puede usarse fuera del entorno local.");
  }
  return token;
}

export function isDocumentRetentionJobConfigured() {
  try {
    getDocumentRetentionJobToken();
    return true;
  } catch {
    return false;
  }
}
