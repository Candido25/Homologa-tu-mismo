import "server-only";

import { PostgresCaseRepository } from "@/adapters/cases/postgres-case-repository";
import { SupabaseCaseRepository } from "@/adapters/cases/supabase-case-repository";
import { LocalTestCurrentUserProvider } from "@/adapters/identity/local-test-current-user";
import { SupabaseCurrentUserProvider } from "@/adapters/identity/supabase-current-user";
import type { CaseRepository } from "@/core/cases/case-repository";
import type { CurrentUserProvider } from "@/core/identity/current-user";
import {
  getAuthProviderName,
  getDatabaseProviderName,
  isApplicationDataConfigured,
  isLocalTestAuthEnabled,
  isSupabaseConfigured,
} from "@/lib/env";

export function getCurrentUserProvider(): CurrentUserProvider {
  const provider = getAuthProviderName();

  if (provider === "local-test") {
    if (!isLocalTestAuthEnabled()) {
      throw new Error("La identidad ficticia solo puede habilitarse en APP_ENV=local.");
    }
    return new LocalTestCurrentUserProvider();
  }

  if (provider === "supabase") {
    if (!isSupabaseConfigured()) throw new Error("Supabase Auth no está configurado.");
    return new SupabaseCurrentUserProvider();
  }

  throw new Error("Microsoft Entra External ID todavía no está implementado.");
}

export function getCaseRepository(): CaseRepository {
  const provider = getDatabaseProviderName();
  return provider === "postgres" ? new PostgresCaseRepository() : new SupabaseCaseRepository();
}

export function isPrivateAreaConfigured() {
  const authProvider = getAuthProviderName();
  const authConfigured = authProvider === "local-test" ? isLocalTestAuthEnabled() : isSupabaseConfigured();
  return authConfigured && isApplicationDataConfigured();
}
