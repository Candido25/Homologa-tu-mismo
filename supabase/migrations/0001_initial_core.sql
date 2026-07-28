-- Homologa Tú Mismo
-- Esquema inicial para Supabase PostgreSQL.
-- Ejecutar mediante Supabase CLI o el sistema de migraciones del proyecto.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  country_code char(2),
  locale text not null default 'es',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.countries (
  code char(2) primary key,
  name_es text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.professions (
  code text primary key,
  name_es text not null,
  regulated_in_spain boolean,
  target_profession_es text,
  notes text,
  active boolean not null default true,
  last_verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
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
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id)
);

create table public.case_status_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  previous_status text,
  new_status text not null,
  source text not null default 'user'
    check (source in ('user', 'system', 'specialist', 'official_notice')),
  note text,
  occurred_at timestamptz not null default timezone('utc', now())
);

create table public.document_types (
  code text primary key,
  name_es text not null,
  description text,
  sensitivity text not null default 'personal'
    check (sensitivity in ('public', 'personal', 'high')),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.legal_sources (
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
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.decision_rules (
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
  created_at timestamptz not null default timezone('utc', now()),
  unique (code, version)
);

create table public.case_requirements (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  document_type_code text not null references public.document_types(code),
  required boolean not null default true,
  status text not null default 'missing'
    check (status in ('missing', 'uploaded', 'processing', 'approved', 'needs_action', 'not_applicable')),
  reason text,
  source_rule_id uuid references public.decision_rules(id) on delete set null,
  due_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (case_id, document_type_code)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  user_id uuid not null,
  document_type_code text not null references public.document_types(code),
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  sha256 text,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'reviewed_ok', 'needs_action', 'rejected', 'expired', 'deleted')),
  version integer not null default 1 check (version > 0),
  retention_until timestamptz,
  uploaded_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  foreign key (case_id, user_id) references public.cases(id, user_id) on delete cascade
);

create table public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  reviewer_type text not null check (reviewer_type in ('rules', 'ai', 'human')),
  provider text,
  model_name text,
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  findings jsonb not null default '[]'::jsonb,
  summary text,
  requires_human_review boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.processing_jobs (
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
  created_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null,
  document_version text not null,
  granted boolean not null,
  recorded_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb
);

create table public.audit_events (
  id bigint generated by default as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  result text not null default 'success' check (result in ('success', 'denied', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index cases_user_id_idx on public.cases(user_id);
create index cases_status_idx on public.cases(status);
create index case_status_events_case_id_idx on public.case_status_events(case_id, occurred_at desc);
create index case_requirements_case_id_idx on public.case_requirements(case_id);
create index documents_case_id_idx on public.documents(case_id);
create index documents_user_id_idx on public.documents(user_id);
create index document_reviews_document_id_idx on public.document_reviews(document_id, created_at desc);
create index processing_jobs_status_idx on public.processing_jobs(status, created_at);
create index audit_events_case_id_idx on public.audit_events(case_id, created_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger professions_set_updated_at
before update on public.professions
for each row execute function public.set_updated_at();

create trigger cases_set_updated_at
before update on public.cases
for each row execute function public.set_updated_at();

create trigger legal_sources_set_updated_at
before update on public.legal_sources
for each row execute function public.set_updated_at();

create trigger case_requirements_set_updated_at
before update on public.case_requirements
for each row execute function public.set_updated_at();

create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.countries enable row level security;
alter table public.professions enable row level security;
alter table public.cases enable row level security;
alter table public.case_status_events enable row level security;
alter table public.document_types enable row level security;
alter table public.legal_sources enable row level security;
alter table public.decision_rules enable row level security;
alter table public.case_requirements enable row level security;
alter table public.documents enable row level security;
alter table public.document_reviews enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.consents enable row level security;
alter table public.audit_events enable row level security;

create policy "Public can read active countries"
on public.countries for select
to anon, authenticated
using (active = true);

create policy "Public can read active professions"
on public.professions for select
to anon, authenticated
using (active = true);

create policy "Public can read active document types"
on public.document_types for select
to anon, authenticated
using (active = true);

create policy "Public can read active legal sources"
on public.legal_sources for select
to anon, authenticated
using (active = true);

create policy "Users can read own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can create own cases"
on public.cases for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read own cases"
on public.cases for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update own cases"
on public.cases for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own draft cases"
on public.cases for delete
to authenticated
using ((select auth.uid()) = user_id and status = 'draft');

create policy "Users can read own case events"
on public.case_status_events for select
to authenticated
using (
  exists (
    select 1 from public.cases c
    where c.id = case_status_events.case_id
      and c.user_id = (select auth.uid())
  )
);

create policy "Users can create own case events"
on public.case_status_events for insert
to authenticated
with check (
  actor_user_id = (select auth.uid())
  and exists (
    select 1 from public.cases c
    where c.id = case_status_events.case_id
      and c.user_id = (select auth.uid())
  )
);

create policy "Users can read own requirements"
on public.case_requirements for select
to authenticated
using (
  exists (
    select 1 from public.cases c
    where c.id = case_requirements.case_id
      and c.user_id = (select auth.uid())
  )
);

create policy "Users can read own documents"
on public.documents for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can register own documents"
on public.documents for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own document metadata"
on public.documents for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read own document reviews"
on public.document_reviews for select
to authenticated
using (
  exists (
    select 1 from public.documents d
    where d.id = document_reviews.document_id
      and d.user_id = (select auth.uid())
  )
);

create policy "Users can read own processing jobs"
on public.processing_jobs for select
to authenticated
using (
  exists (
    select 1 from public.cases c
    where c.id = processing_jobs.case_id
      and c.user_id = (select auth.uid())
  )
);

create policy "Users can read own consents"
on public.consents for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own consents"
on public.consents for insert
to authenticated
with check ((select auth.uid()) = user_id);

grant select on public.countries, public.professions, public.document_types, public.legal_sources to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.cases to authenticated;
grant select, insert on public.case_status_events to authenticated;
grant select on public.case_requirements to authenticated;
grant select, insert, update on public.documents to authenticated;
grant select on public.document_reviews, public.processing_jobs to authenticated;
grant select, insert on public.consents to authenticated;

insert into public.countries (code, name_es) values
  ('PE', 'Perú'),
  ('CL', 'Chile'),
  ('CO', 'Colombia'),
  ('EC', 'Ecuador'),
  ('AR', 'Argentina'),
  ('BO', 'Bolivia'),
  ('VE', 'Venezuela'),
  ('MX', 'México'),
  ('ES', 'España')
on conflict (code) do nothing;

insert into public.document_types (code, name_es, description, sensitivity) values
  ('identity', 'Documento de identidad', 'Pasaporte o documento de identidad utilizado en el trámite.', 'high'),
  ('degree', 'Título académico', 'Título o diploma cuya homologación o equivalencia se solicita.', 'high'),
  ('academic_record', 'Certificado académico', 'Asignaturas, calificaciones, duración y carga académica.', 'high'),
  ('curriculum', 'Plan de estudios', 'Estructura curricular oficial de la formación.', 'personal'),
  ('syllabi', 'Programas o sílabos', 'Contenidos de las asignaturas cursadas.', 'personal'),
  ('apostille', 'Apostilla o legalización', 'Documento o constancia de apostilla o legalización.', 'high'),
  ('payment', 'Comprobante de tasa', 'Justificación del pago de la tasa administrativa.', 'personal'),
  ('official_notice', 'Notificación oficial', 'Requerimiento, subsanación o comunicación administrativa.', 'high'),
  ('resolution', 'Resolución', 'Resolución emitida por la autoridad competente.', 'high')
on conflict (code) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-documents',
  'case-documents',
  false,
  26214400,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload files to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can read files from own folder"
on storage.objects for select
to authenticated
using (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete files from own folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
