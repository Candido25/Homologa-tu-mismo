import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { cookies } from "next/headers";
import type { AuthenticatedUser } from "@/core/identity/current-user";
import { getAuthSessionCookieName } from "@/lib/env";
import { getEntraConfig } from "@/lib/entra/config";
import { query, withTransaction } from "@/lib/postgres/pool";

type AuthFlow = {
  codeVerifier: string;
  nonce: string;
  nextPath: string;
};

type EntraIdentity = {
  issuer: string;
  subject: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
};

type IdentityRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  provider: string;
  issuer: string;
  subject: string;
};

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function opaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function safeNextPath(value: string | null | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/panel";
}

export async function saveEntraAuthFlow(input: {
  state: string;
  codeVerifier: string;
  nonce: string;
  nextPath: string;
}) {
  await query("delete from external_auth_flows where expires_at <= now()");
  await query(
    [
      "insert into external_auth_flows",
      "(state_hash, provider, code_verifier, nonce, next_path, expires_at)",
      "values ($1, 'entra', $2, $3, $4, now() + interval '10 minutes')",
    ].join(" "),
    [digest(input.state), input.codeVerifier, input.nonce, safeNextPath(input.nextPath)],
  );
}

export async function consumeEntraAuthFlow(state: string): Promise<AuthFlow | null> {
  return withTransaction(async (client) => {
    const result = await client.query<{
      code_verifier: string;
      nonce: string;
      next_path: string;
      expires_at: Date;
    }>(
      [
        "delete from external_auth_flows",
        "where state_hash = $1 and provider = 'entra'",
        "returning code_verifier, nonce, next_path, expires_at",
      ].join(" "),
      [digest(state)],
    );
    const row = result.rows[0];
    if (!row || row.expires_at.getTime() <= Date.now()) return null;

    return {
      codeVerifier: row.code_verifier,
      nonce: row.nonce,
      nextPath: safeNextPath(row.next_path),
    };
  });
}

async function resolveInternalUser(client: PoolClient, identity: EntraIdentity) {
  const lockKey = `entra:${identity.issuer}:${identity.subject}`;
  await client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [lockKey]);

  const existing = await client.query<{ user_id: string }>(
    [
      "select user_id from external_identities",
      "where provider = 'entra' and issuer = $1 and subject = $2",
      "limit 1",
    ].join(" "),
    [identity.issuer, identity.subject],
  );

  let userId = existing.rows[0]?.user_id;
  if (!userId) {
    const user = await client.query<{ id: string }>(
      "insert into app_users (status) values ('active') returning id",
    );
    userId = user.rows[0].id;

    await client.query(
      [
        "insert into external_identities",
        "(user_id, provider, issuer, subject, email, email_verified, last_login_at)",
        "values ($1, 'entra', $2, $3, $4, $5, now())",
      ].join(" "),
      [userId, identity.issuer, identity.subject, identity.email, identity.emailVerified],
    );
    await client.query(
      "insert into profiles (id, display_name) values ($1, $2)",
      [userId, identity.displayName],
    );
  } else {
    await client.query(
      [
        "update external_identities",
        "set email = $3, email_verified = $4, last_login_at = now(), updated_at = now()",
        "where provider = 'entra' and issuer = $1 and subject = $2",
      ].join(" "),
      [identity.issuer, identity.subject, identity.email, identity.emailVerified],
    );
    if (identity.displayName) {
      await client.query(
        "update profiles set display_name = $2, updated_at = now() where id = $1",
        [userId, identity.displayName],
      );
    }
  }

  return userId;
}

export async function createEntraSession(identity: EntraIdentity) {
  const token = opaqueToken();
  const config = getEntraConfig();

  await withTransaction(async (client) => {
    const userId = await resolveInternalUser(client, identity);
    await client.query("delete from auth_sessions where expires_at <= now() or revoked_at is not null");
    await client.query(
      [
        "insert into auth_sessions (user_id, token_hash, expires_at)",
        "values ($1, $2, now() + make_interval(hours => $3))",
      ].join(" "),
      [userId, digest(token), config.sessionHours],
    );
  });

  return token;
}

export function setEntraSessionCookie(
  response: { cookies: { set: (name: string, value: string, options: object) => void } },
  token: string,
) {
  const production = process.env.APP_ENV !== "local";
  response.cookies.set(getAuthSessionCookieName(), token, {
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    path: "/",
    maxAge: getEntraConfig().sessionHours * 60 * 60,
  });
}

export async function getCurrentEntraUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAuthSessionCookieName())?.value;
  if (!token) return null;

  const result = await query<IdentityRow>(
    [
      "select u.id, i.email, p.display_name, i.provider, i.issuer, i.subject",
      "from auth_sessions s",
      "join app_users u on u.id = s.user_id and u.status = 'active'",
      "join external_identities i on i.user_id = u.id and i.provider = 'entra'",
      "left join profiles p on p.id = u.id",
      "where s.token_hash = $1 and s.revoked_at is null and s.expires_at > now()",
      "order by i.last_login_at desc nulls last",
      "limit 1",
    ].join(" "),
    [digest(token)],
  );
  const row = result.rows[0];
  if (!row) return null;

  await query(
    "update auth_sessions set last_seen_at = now() where token_hash = $1 and last_seen_at < now() - interval '5 minutes'",
    [digest(token)],
  );

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    provider: row.provider,
    issuer: row.issuer,
    subject: row.subject,
  };
}

export async function revokeCurrentEntraSession() {
  const cookieStore = await cookies();
  const cookieName = getAuthSessionCookieName();
  const token = cookieStore.get(cookieName)?.value;
  if (token) {
    await query(
      "update auth_sessions set revoked_at = now() where token_hash = $1 and revoked_at is null",
      [digest(token)],
    );
  }
  cookieStore.delete(cookieName);
}
