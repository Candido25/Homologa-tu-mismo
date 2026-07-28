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

export function getApplicationUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}
