import "server-only";

import type { AuthenticatedUser, CurrentUserProvider } from "@/core/identity/current-user";
import { isEntraConfigured } from "@/lib/env";
import { getCurrentEntraUser } from "@/lib/entra/session";

export class EntraCurrentUserProvider implements CurrentUserProvider {
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    if (!isEntraConfigured()) return null;
    return getCurrentEntraUser();
  }
}
