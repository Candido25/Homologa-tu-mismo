-- Homologa Tú Mismo
-- Esquema PostgreSQL portable, sin dependencias de Supabase ni Azure.
-- La aplicación será la única capa con acceso de escritura desde Internet.

begin;

create extension if not exists pgcrypto;

create table if not exists public.schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Identidad interna independiente del proveedor de autenticación.
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active'
    check (status in ('pending', 'active', 'blocked', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.external_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  provider text not null,
  issuer text not null,
  subject text not null,
  email text,
  email_verified boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, issuer, subject)
);

create unique index if not exists external_identities_email_idx
on public.external_identities (provider, lower(email))
where email is not null;

create table if not exists public.profiles (
  id uuid primary key references public.app_users(id) on delete cascade,
  display_name text,
  country_code char(2),
  locale text not null default 'es',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.countries (
  code char(2) primary key,
  name_es text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.professions (
  code text primary key,
  name_es text not null,
  regulated_in_spain boolean,
  target_profession_es text,
  notes text,
  active boolean not null default true,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  title text not null,
  origin_country_code char(2) references public.countries(code),
  degree_name text not null,
  institution_name text,
  profession_code text references public.professions(code),
  objective text not null check (objective in ('work', 'academic', 'study', 'other')),
  procedure_type text not null default 'undetermined'
    check (procedure_type in (
      'undetermined',
      'homologation',
      'equivalence',
      'validation',
      'professional_recognition'
    )),
  status text not null default 'draft'
    check (status in (
      'draft',
      'diagnosed',
      'collecting_documents',
      'ready_for_review',
      'submitted',
      'under_review',
      'subsanation_required',
      'resolved_favorable',
      'resolved_conditional',
      'resolved_unfavorable',
      'closed'
    )),
  diagnostic_version text,
  diagnostic_payload jsonb not null default '{}'::jsonb,
  official_case_number text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.case_status_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  actor_user_id uuid references public.app_users(id) on delete set null,
  previous_status text,
  new_status text not null,
  source text not null default 'user'
    check (source in ('user', 'system', 'specialist', 'official_notice')),
  note text,
  occurred_at timestamptz not null default now()
);

create table if not exists public.document_types (
  code text primary key,
  name_es text not null,
  description text,
  sensitivity text not null default 'personal'
    check (sensitivity in ('public', 'personal', 'high')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.legal_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text not null
    check (source_type in ('law', 'regulation', 'official_guide', 'official_portal', 'administrative_criterion')),
  jurisdiction text not null default 'ES',
  official_url text not null,
  published_on date,
  effective_from date,
  effective_until date,
  last_verified_at timestamptz not null,
  content_hash text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decision_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  version integer not null default 1,
  procedure_type text not null,
  country_code char(2) references public.countries(code),
  profession_code text references public.professions(code),
  conditions jsonb not null,
  outcome jsonb not null,
  legal_source_id uuid references public.legal_sources(id) on delete restrict,
  effective_from date not null,
  effective_until date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (code, version)
);

create table if not exists public.case_requirements (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  document_type_code text not null references public.document_types(code),
  required boolean not null default true,
  status text not null default 'missing'
    check (status in ('missing', 'uploaded', 'processing', 'approved', 'needs_action', 'not_applicable')),
  reason text,
  source_rule_id uuid references public.decision_rules(id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, document_type_code)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  user_id uuid not null,
  document_type_code text not null references public.document_types(code),
  storage_provider text not null default 'azure_blob',
  storage_container text not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  sha256 text,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'reviewed_ok', 'needs_action', 'rejected', 'expired', 'deleted')),
  version integer not null default 1 check (version > 0),
  retention_until timestamptz,
  uploaded_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_provider, storage_container, storage_path),
  foreign key (case_id, user_id) references public.cases(id, user_id) on delete cascade
);

create table if not exists public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  reviewer_type text not null check (reviewer_type in ('rules', 'ai', 'human')),
  provider text,
  model_name text,
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  findings jsonb not null default '[]'::jsonb,
  summary text,
  requires_human_review boolean not null default false,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  job_type text not null check (job_type in ('ocr', 'extract', 'compare', 'ai_review', 'generate_report', 'delete_file')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  provider text,
  attempts integer not null default 0 check (attempts >= 0),
  error_code text,
  error_message_safe text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  consent_type text not null,
  document_version text not null,
  granted boolean not null,
  recorded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.audit_events (
  id bigint generated by default as identity primary key,
  actor_user_id uuid references public.app_users(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  result text not null default 'success' check (result in ('success', 'denied', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cases_user_id_idx on public.cases(user_id);
create index if not exists cases_status_idx on public.cases(status);
create index if not exists case_status_events_case_id_idx on public.case_status_events(case_id, occurred_at desc);
create index if not exists case_requirements_case_id_idx on public.case_requirements(case_id);
create index if not exists documents_case_id_idx on public.documents(case_id);
create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists document_reviews_document_id_idx on public.document_reviews(document_id, created_at desc);
create index if not exists processing_jobs_status_idx on public.processing_jobs(status, created_at);
create index if not exists audit_events_case_id_idx on public.audit_events(case_id, created_at desc);

-- Triggers idempotentes.
drop trigger if exists app_users_set_updated_at on public.app_users;
create trigger app_users_set_updated_at before update on public.app_users
for each row execute function public.set_updated_at();

drop trigger if exists external_identities_set_updated_at on public.external_identities;
create trigger external_identities_set_updated_at before update on public.external_identities
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists professions_set_updated_at on public.professions;
create trigger professions_set_updated_at before update on public.professions
for each row execute function public.set_updated_at();

drop trigger if exists cases_set_updated_at on public.cases;
create trigger cases_set_updated_at before update on public.cases
for each row execute function public.set_updated_at();

drop trigger if exists legal_sources_set_updated_at on public.legal_sources;
create trigger legal_sources_set_updated_at before update on public.legal_sources
for each row execute function public.set_updated_at();

drop trigger if exists case_requirements_set_updated_at on public.case_requirements;
create trigger case_requirements_set_updated_at before update on public.case_requirements
for each row execute function public.set_updated_at();

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at before update on public.documents
for each row execute function public.set_updated_at();

insert into public.schema_migrations (version)
values ('0001_portable_core')
on conflict (version) do nothing;

commit;
