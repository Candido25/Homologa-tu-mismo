import "server-only";

import type { AuthenticatedUser, CurrentUserProvider } from "@/core/identity/current-user";
import { getLocalTestUserId, isLocalTestAuthEnabled } from "@/lib/env";
import { query } from "@/lib/postgres/pool";

type IdentityRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  provider: string;
  issuer: string;
  subject: string;
  role: "USER" | "ADVISOR" | "ADMIN";
};

const identitySql = [
  "select u.id, u.role, i.email, p.display_name, i.provider, i.issuer, i.subject",
  "from app_users u",
  "join external_identities i on i.user_id = u.id",
  "left join profiles p on p.id = u.id",
  "where u.id = $1 and u.status = 'active'",
  "order by i.created_at asc",
  "limit 1",
].join(" ");

export class LocalTestCurrentUserProvider implements CurrentUserProvider {
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    if (!isLocalTestAuthEnabled()) return null;

    const result = await query<IdentityRow>(identitySql, [getLocalTestUserId()]);
    const row = result.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      provider: row.provider,
      issuer: row.issuer,
      subject: row.subject,
      role: row.role || "USER",
    };
  }
}
