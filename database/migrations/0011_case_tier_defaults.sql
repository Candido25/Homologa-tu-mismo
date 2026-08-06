-- Compatibilidad de expedientes para repositorios y despliegues Vercel/Supabase.
-- No cambia reglas juridicas ni activa funcionalidades comerciales.

begin;

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

insert into public.schema_migrations (version)
values ('0011_case_tier_defaults')
on conflict (version) do nothing;

commit;
