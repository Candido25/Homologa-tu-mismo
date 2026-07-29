begin;

insert into public.countries (code, name_es)
values
  ('PE', 'Perú'),
  ('ES', 'España'),
  ('CO', 'Colombia'),
  ('EC', 'Ecuador'),
  ('BO', 'Bolivia'),
  ('CL', 'Chile'),
  ('AR', 'Argentina'),
  ('MX', 'México'),
  ('VE', 'Venezuela')
on conflict (code) do update
set name_es = excluded.name_es,
    active = true;

insert into public.document_types (code, name_es, description, sensitivity)
values
  ('identity_document', 'Documento de identidad', 'Pasaporte, DNI u otro documento de identidad aplicable.', 'high'),
  ('degree', 'Título o diploma', 'Título académico o profesional cuya homologación se pretende.', 'high'),
  ('transcript', 'Certificado de estudios', 'Asignaturas, créditos, horas y calificaciones.', 'high'),
  ('curriculum', 'Plan de estudios', 'Contenido o programa académico de la titulación.', 'personal'),
  ('apostille', 'Apostilla o legalización', 'Documento acreditativo de apostilla o legalización.', 'high'),
  ('translation', 'Traducción oficial', 'Traducción jurada u oficial cuando corresponda.', 'personal')
on conflict (code) do update
set name_es = excluded.name_es,
    description = excluded.description,
    sensitivity = excluded.sensitivity,
    active = true;

commit;
