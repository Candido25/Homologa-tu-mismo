-- Solo para desarrollo local. No contiene datos reales.
begin;

insert into public.app_users (id, status)
values
  ('00000000-0000-4000-8000-000000000001', 'active'),
  ('00000000-0000-4000-8000-000000000002', 'active')
on conflict (id) do nothing;

insert into public.external_identities (
  user_id,
  provider,
  issuer,
  subject,
  email,
  email_verified
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'local-test',
    'https://local.homologa.test',
    'usuario-a',
    'usuario.a@example.test',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'local-test',
    'https://local.homologa.test',
    'usuario-b',
    'usuario.b@example.test',
    true
  )
on conflict (provider, issuer, subject) do nothing;

insert into public.profiles (id, display_name, country_code)
values
  ('00000000-0000-4000-8000-000000000001', 'Usuario ficticio A', 'PE'),
  ('00000000-0000-4000-8000-000000000002', 'Usuario ficticio B', 'CO')
on conflict (id) do update
set display_name = excluded.display_name,
    country_code = excluded.country_code;

insert into public.cases (
  id,
  user_id,
  title,
  origin_country_code,
  degree_name,
  objective,
  procedure_type,
  status,
  diagnostic_version,
  diagnostic_payload
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Expediente ficticio del usuario A',
    'PE',
    'Ingeniería de prueba',
    'work',
    'homologation',
    'diagnosed',
    'local-fixture-1',
    '{"fixture":true,"owner":"usuario-a"}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    'Expediente ficticio del usuario B',
    'CO',
    'Profesión de prueba',
    'study',
    'equivalence',
    'draft',
    'local-fixture-1',
    '{"fixture":true,"owner":"usuario-b"}'::jsonb
  )
on conflict (id) do nothing;

commit;
