-- Sesiones opacas y flujos OIDC efímeros para proveedores externos.
-- No se guardan access tokens, refresh tokens ni ID tokens.

begin;

create table if not exists public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash char(64) not null unique,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists auth_sessions_user_id_idx
on public.auth_sessions (user_id, expires_at desc);

create index if not exists auth_sessions_active_idx
on public.auth_sessions (expires_at)
where revoked_at is null;

create table if not exists public.external_auth_flows (
  state_hash char(64) primary key,
  provider text not null,
  code_verifier text not null,
  nonce text not null,
  next_path text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists external_auth_flows_expires_at_idx
on public.external_auth_flows (expires_at);

insert into public.schema_migrations (version)
values ('0002_auth_sessions')
on conflict (version) do nothing;

commit;
