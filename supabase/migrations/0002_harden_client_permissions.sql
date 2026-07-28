-- Endurecimiento de permisos del cliente.
-- RLS controla filas; los grants por columna controlan qué datos puede alterar el navegador.

revoke insert, update on public.cases from authenticated;
grant insert (
  user_id,
  title,
  origin_country_code,
  degree_name,
  institution_name,
  profession_code,
  objective,
  diagnostic_payload
) on public.cases to authenticated;
grant update (
  title,
  origin_country_code,
  degree_name,
  institution_name,
  profession_code,
  objective,
  diagnostic_payload
) on public.cases to authenticated;

-- Los cambios de estado se realizan mediante el servidor para validar transiciones
-- y escribir el evento de auditoría correspondiente.
revoke insert on public.case_status_events from authenticated;
drop policy if exists "Users can create own case events" on public.case_status_events;

revoke update on public.profiles from authenticated;
grant update (display_name, country_code, locale)
on public.profiles to authenticated;

revoke insert, update on public.documents from authenticated;
grant insert (
  case_id,
  user_id,
  document_type_code,
  storage_path,
  original_filename,
  mime_type,
  size_bytes,
  sha256
) on public.documents to authenticated;

drop policy if exists "Users can update own document metadata" on public.documents;

revoke insert on public.consents from authenticated;
grant insert (
  user_id,
  consent_type,
  document_version,
  granted,
  metadata
) on public.consents to authenticated;

-- No se concede escritura directa a requisitos, revisiones, trabajos,
-- reglas, fuentes legales ni auditoría. Esas operaciones usan lógica confiable del servidor.
