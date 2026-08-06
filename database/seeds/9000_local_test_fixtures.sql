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

insert into public.pilot_participants (
  id,
  user_id,
  invitation_code,
  state,
  accepted_privacy_version,
  accepted_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'PILOTO-FICTICIO-A',
    'active',
    'privacidad-piloto-v1',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    'PILOTO-FICTICIO-B',
    'suspended',
    'privacidad-piloto-v1',
    now()
  )
on conflict (id) do update
set state = excluded.state,
    accepted_privacy_version = excluded.accepted_privacy_version,
    accepted_at = excluded.accepted_at;

update public.pilot_participants
set suspended_cause = 'cross_user_access_attempt'
where id = '20000000-0000-4000-8000-000000000002';

insert into public.pilot_events (participant_id, actor_user_id, event_type, event_payload)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'pilot.participation.activated',
    '{"fixture":true}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    'pilot.suspended.cross_user_access_attempt',
    '{"fixture":true}'::jsonb
  );

insert into public.diagnostic_runs (
  id,
  case_id,
  user_id,
  version,
  input_payload,
  result_payload,
  source_basis,
  requires_human_review
)
values (
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'prototype-2026-07-28',
  '{"country":"PE","degree":"Titulo ficticio","objective":"work"}'::jsonb,
  '{"procedureType":"undetermined","route":"Revision profesional requerida"}'::jsonb,
  'RD 889/2022 activo; PRD_2026 desactivado.',
  true
)
on conflict (id) do nothing;

insert into public.checklist_versions (
  id,
  case_id,
  version,
  generated_from_diagnostic_id
)
values (
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'checklist-rd-889-2022-v1',
  '30000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

insert into public.checklist_items (
  checklist_version_id,
  item_code,
  category,
  title,
  applicable,
  required,
  status,
  preparation,
  compliance_modes,
  explanation,
  source_basis
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    'identity-document',
    'identity',
    'Documento de identidad ficticio',
    true,
    true,
    'missing',
    'Usar archivo ficticio y hash.',
    '["PDF ficticio"]'::jsonb,
    'No se admiten datos personales reales.',
    'RD 889/2022 activo; PRD_2026 desactivado.'
  ),
  (
    '40000000-0000-4000-8000-000000000001',
    'tasa-107-separate',
    'administrative',
    'Tasa 107 separada',
    false,
    false,
    'not_applicable',
    'Conservar como guia versionada.',
    '["referencia informativa"]'::jsonb,
    'La plataforma no paga ni presenta el tramite.',
    'RD 889/2022 activo; PRD_2026 desactivado.'
  )
on conflict (checklist_version_id, item_code) do nothing;

insert into public.tracking_tasks (
  id,
  case_id,
  task_type,
  title,
  description,
  status,
  legal_effect_blocked,
  created_by
)
values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'milestone',
  'Hito ficticio de preparacion',
  'Cronologia interna append-only; no representa plazo ni efecto juridico oficial.',
  'open',
  true,
  '00000000-0000-4000-8000-000000000001'
)
on conflict (id) do nothing;

insert into public.payment_transactions (
  id,
  user_id,
  case_id,
  service_code,
  provider,
  provider_reference,
  idempotency_key,
  amount_cents,
  currency,
  status,
  webhook_payload
)
values (
  '60000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'guia-expediente-ficticia',
  'polar-simulator',
  'polar_sim_fixture_1',
  'fixture-payment-1',
  4900,
  'EUR',
  'simulated_authorized',
  '{"fixture":true}'::jsonb
)
on conflict (idempotency_key) do nothing;

commit;
