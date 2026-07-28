-- Bucket privado para informes generados por la plataforma.
-- Los informes serán creados por procesos confiables del servidor en una fase posterior.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generated-reports',
  'generated-reports',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- El navegador solo podrá leer informes de la carpeta del usuario autenticado.
-- No se concede inserción, actualización ni eliminación directa al cliente.
create policy "Users can read own generated reports"
on storage.objects for select
to authenticated
using (
  bucket_id = 'generated-reports'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
