-- Datos de referencia y permisos explícitos para proyectos creados
-- con "Automatically expose new tables" desactivado.

insert into public.countries (code, name_es, active)
values
  ('PE', 'Perú', true),
  ('CL', 'Chile', true),
  ('CO', 'Colombia', true),
  ('EC', 'Ecuador', true),
  ('AR', 'Argentina', true),
  ('BO', 'Bolivia', true),
  ('VE', 'Venezuela', true),
  ('MX', 'México', true)
on conflict (code) do update
set name_es = excluded.name_es,
    active = excluded.active;

grant usage on schema public to anon, authenticated;

grant select on table public.countries to anon, authenticated;
grant select on table public.professions to anon, authenticated;
grant select on table public.document_types to anon, authenticated;
grant select on table public.legal_sources to anon, authenticated;

grant select on table public.profiles to authenticated;
grant select on table public.cases to authenticated;

-- La ruta y versión del diagnóstico son datos orientativos del expediente,
-- no estados oficiales. El estado continúa reservado al servidor.
grant insert (procedure_type, diagnostic_version)
on public.cases to authenticated;

grant update (procedure_type, diagnostic_version)
on public.cases to authenticated;
