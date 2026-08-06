-- Compatibilidad para el despliegue Supabase activo.
-- Mantiene RD 889/2022 como norma activa y no introduce decisiones juridicas.

alter table public.cases add column if not exists tier text not null default 'FREE'
  check (tier in ('FREE', 'PREMIUM'));

alter table public.cases add column if not exists current_stage text not null default 'PREPARACION_DOCUMENTAL'
  check (current_stage in (
    'PREPARACION_DOCUMENTAL',
    'APOSTILLA_Y_LEGALIZACION',
    'PAGO_TASA_790_070',
    'PRESENTACION_SEDE_ELECTRONICA',
    'EN_REVISION_MINISTERIO',
    'SUBSANACION_REQUERIDA',
    'RESOLUCION_OFICIAL'
  ));

create table if not exists public.case_activity_logs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null,
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists case_activity_logs_case_id_idx
on public.case_activity_logs(case_id, created_at desc);

alter table public.case_activity_logs enable row level security;

drop policy if exists "Users can read own case activity logs" on public.case_activity_logs;
create policy "Users can read own case activity logs"
on public.case_activity_logs for select
to authenticated
using (
  exists (
    select 1 from public.cases c
    where c.id = case_activity_logs.case_id
      and c.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can create own case activity logs" on public.case_activity_logs;
create policy "Users can create own case activity logs"
on public.case_activity_logs for insert
to authenticated
with check (
  exists (
    select 1 from public.cases c
    where c.id = case_activity_logs.case_id
      and c.user_id = (select auth.uid())
  )
);

grant select, insert on public.case_activity_logs to authenticated;
