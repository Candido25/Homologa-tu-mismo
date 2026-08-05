ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS current_stage text not null default 'PREPARACION_DOCUMENTAL'
  check (current_stage in (
    'PREPARACION_DOCUMENTAL',
    'APOSTILLA_Y_LEGALIZACION',
    'PAGO_TASA_790_070',
    'PRESENTACION_SEDE_ELECTRONICA',
    'EN_REVISION_MINISTERIO',
    'SUBSANACION_REQUERIDA',
    'RESOLUCION_OFICIAL'
  ));

CREATE TABLE IF NOT EXISTS public.case_activity_logs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null,
  description text not null,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS case_activity_logs_case_id_idx ON public.case_activity_logs(case_id, created_at desc);

insert into public.schema_migrations (version)
values ('0004_case_timeline')
on conflict (version) do nothing;
