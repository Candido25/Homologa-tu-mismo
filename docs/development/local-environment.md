# Entorno local sin consumo de Azure

Este entorno permite desarrollar y probar Homologa Tú Mismo sin crear recursos en Azure y sin usar documentos o identidades reales.

## Componentes

- PostgreSQL 16.14 en Docker.
- Azurite 3.36.0 para emular Azure Blob, Queue y Table Storage.
- Next.js ejecutado localmente con Node.js 22.
- Dos usuarios ficticios y dos expedientes ficticios para pruebas de aislamiento.
- Adaptador de documentos privados con hash SHA-256 y límite de 25 MB.

## Requisitos

1. Node.js 22.
2. Git.
3. Docker Desktop con Docker Compose v2.
4. Puertos locales libres: `3000`, `5432`, `10000`, `10001` y `10002`.

No se necesita Azure CLI, una suscripción de Azure ni credenciales de Supabase para levantar los servicios locales.

## Preparación inicial

Desde la raíz del repositorio:

```bash
npm install
cp .env.example .env.local
npm run local:up
npm run db:migrate
npm run db:seed
npm run db:verify
npm run security:verify-local
npm run storage:verify
npm run dev
npm run app:verify-local
```

En PowerShell, la copia del archivo puede hacerse con:

```powershell
Copy-Item .env.example .env.local
```

Abrir `http://localhost:3000`.

## Comandos

```bash
npm run local:up       # inicia PostgreSQL y Azurite
npm run local:status   # muestra el estado de los contenedores
npm run db:migrate     # aplica el esquema PostgreSQL portable
npm run db:seed        # agrega referencias y datos ficticios
npm run db:verify      # verifica el historial de migraciones
npm run security:verify-local # valida aislamiento entre dos usuarios ficticios
npm run storage:verify # prueba contenedor privado, carga, lectura y eliminación
npm run app:verify-local # valida el flujo web local con Next.js iniciado
npm run local:down     # detiene los servicios sin borrar datos
npm run local:reset    # borra volúmenes y reconstruye todo
```

`local:reset` elimina exclusivamente los volúmenes Docker del entorno local. No interactúa con Azure.

`db:migrate` aplica todas las migraciones numeradas de `database/migrations` de forma idempotente. También existe `db:migrate:portable`, que usa directamente `DATABASE_URL` y es el comando empleado por GitHub Actions para Azure.

## Credenciales locales

Las credenciales definidas en `compose.yaml` son deliberadamente simples y solo sirven en la computadora de desarrollo:

```text
Base de datos: homologa
Usuario: homologa
Contraseña: homologa_local_only
Puerto: 5432
```

Nunca deben reutilizarse en desarrollo remoto ni producción.

## Identidades ficticias

El archivo `database/seeds/9000_local_test_fixtures.sql` crea:

- Usuario ficticio A: `00000000-0000-4000-8000-000000000001`.
- Usuario ficticio B: `00000000-0000-4000-8000-000000000002`.

Cada usuario tiene un expediente propio. El valor de `LOCAL_TEST_USER_ID` selecciona cuál de esos usuarios representa la sesión local.

Para cambiar de usuario de prueba, editar `.env.local`, reiniciar `npm run dev` y usar uno de los UUID anteriores.

`npm run security:verify-local` usa esos dos usuarios y falla si alguno puede listar o abrir por ID el expediente del otro.

Con `npm run dev` en ejecución, `npm run app:verify-local` comprueba salud, diagnóstico,
bloqueo de origen cruzado, panel del usuario ficticio A y denegación del expediente del usuario ficticio B.

## Almacenamiento local

Azurite escucha en:

```text
Blob:  http://127.0.0.1:10000
Queue: http://127.0.0.1:10001
Table: http://127.0.0.1:10002
```

La aplicación usa `UseDevelopmentStorage=true`. Esa cadena solo es válida para el emulador local y no debe aparecer en producción.

Azurite se inicia con `--skipApiVersionCheck` porque el SDK puede emitir una versión de API posterior a la versión base del emulador. Esta opción se limita al desarrollo local y al CI; nunca se aplica a Azure Blob Storage real.

Los contenedores previstos son:

- `case-documents`
- `generated-reports`

Los adaptadores `AzuriteDocumentStorage` y `AzureBlobDocumentStorage` comparten estas reglas:

- usa contenedores privados sin acceso público;
- genera rutas con usuario, expediente y documento;
- admite únicamente PDF, JPEG y PNG y valida su firma binaria;
- rechaza archivos vacíos o superiores a 25 MB;
- calcula SHA-256 antes de guardar y lo comprueba al leer;
- rechaza rutas fuera del patrón autorizado;
- permite leer y eliminar objetos mediante el contrato portable.

`AzureBlobDocumentStorage` usa identidad administrada mediante `DefaultAzureCredential`; no debe usar claves de cuenta ni variables `NEXT_PUBLIC_*`.

La API documental privada ya integra autorización por propietario, metadatos en PostgreSQL y contenido en Azurite. Para validarla con un PDF generado y sin datos personales:

```bash
npm run documents:verify-local
```

La prueba bloquea origen cruzado, expediente ajeno, MIME inválido o suplantado, archivos vacíos y archivos superiores a 25 MB. Después comprueba contenedor privado, ruta por propietario, metadatos, SHA-256, descarga desde el servidor, borrado físico y estado de eliminación.

La interfaz documental se habilita únicamente cuando `DOCUMENT_UPLOAD_UI_ENABLED=true`. Esta bandera se usa en el entorno local con identidad y archivos ficticios; debe permanecer desactivada en cualquier entorno que pueda recibir datos reales hasta completar la política de retención y la revisión previa al lanzamiento.

### Retención documental

Cada archivo recibe `retention_until` según `DOCUMENT_RETENTION_DAYS`. El proceso interno protegido elimina físicamente los blobs vencidos, marca sus metadatos como eliminados y registra `document.deleted` con fuente `retention`, sin guardar nombre ni contenido en auditoría.

```bash
npm run retention:verify-local
```

La prueba confirma credencial obligatoria, rechazo de token incorrecto, conservación del archivo vigente, eliminación del vencido, idempotencia y auditoría. `DOCUMENT_RETENTION_JOB_TOKEN` debe ser un secreto independiente en entornos administrados; el valor incluido en `.env.example` solo es válido con `APP_ENV=local`.

El programador invoca:

```text
POST /api/internal/retencion-documental?limit=50
Authorization: Bearer <DOCUMENT_RETENTION_JOB_TOKEN>
```

## Seguridad de esta fase

- No usar nombres, correos, títulos ni documentos reales.
- No exponer PostgreSQL ni Azurite a Internet.
- No publicar `.env.local`.
- No almacenar claves de Azure.
- No activar `DOCUMENT_UPLOAD_UI_ENABLED` fuera del entorno ficticio hasta aprobar la revisión previa al lanzamiento.
- No reutilizar el token local del proceso de retención en entornos administrados.
- No ejecutar comandos `az deployment ... create`.

## Solución de problemas

### El puerto 5432 está ocupado

Cambiar en `.env.local`:

```text
POSTGRES_PORT=5433
DATABASE_URL=postgresql://homologa:homologa_local_only@localhost:5433/homologa
```

Después reiniciar:

```bash
npm run local:down
npm run local:up
```

### PostgreSQL todavía no está listo

```bash
npm run local:status
```

Esperar hasta que `postgres` aparezca como `healthy` y volver a ejecutar `npm run db:migrate`.

### Azurite no responde

Comprobar que el servicio aparece activo:

```bash
npm run local:status
```

Después volver a ejecutar:

```bash
npm run storage:verify
```

### Reconstrucción completa

```bash
npm run local:reset
```

Este comando destruye y recrea únicamente la base local y los datos ficticios.
