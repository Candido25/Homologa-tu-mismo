import "server-only";

import type { AuthenticatedUser, CurrentUserProvider } from "@/core/identity/current-user";
import { getPublicSupabaseConfig, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export class SupabaseCurrentUserProvider implements CurrentUserProvider {
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const displayName =
      typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
        ? user.user_metadata.full_name.trim()
        : null;

    // Fetch the role from the public.app_users table
    // Since RLS is a thing, make sure this select is allowed for the user themselves, or use a service role if needed
    // Assuming the user can select their own record
    const { data: dbUser } = await supabase
      .from("app_users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email || null,
      displayName,
      provider: "supabase",
      issuer: getPublicSupabaseConfig().url,
      subject: user.id,
      role: dbUser?.role || "USER",
    };
  }
}
