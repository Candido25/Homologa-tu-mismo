# Entorno local sin consumo de Azure

Este entorno permite desarrollar y probar Homologa Tú Mismo sin crear recursos en Azure y sin usar documentos o identidades reales.

## Componentes

- PostgreSQL 16.14 en Docker.
- Azurite 3.36.0 para emular Azure Blob, Queue y Table Storage.
- Next.js ejecutado localmente con Node.js 22.
- Dos usuarios ficticios y dos expedientes ficticios para pruebas de aislamiento.

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
npm run dev
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
npm run local:down     # detiene los servicios sin borrar datos
npm run local:reset    # borra volúmenes y reconstruye todo
```

`local:reset` elimina exclusivamente los volúmenes Docker del entorno local. No interactúa con Azure.

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

Cada usuario tiene un expediente propio. Estos registros permitirán demostrar que el repositorio de expedientes no devuelve información del otro usuario.

## Almacenamiento local

Azurite escucha en:

```text
Blob:  http://127.0.0.1:10000
Queue: http://127.0.0.1:10001
Table: http://127.0.0.1:10002
```

La aplicación usará `UseDevelopmentStorage=true`. Esa cadena solo es válida para el emulador local y no debe aparecer en producción.

Los contenedores previstos son:

- `case-documents`
- `generated-reports`

Se crearán desde el adaptador local de almacenamiento en una fase posterior.

## Seguridad de esta fase

- No usar nombres, correos, títulos ni documentos reales.
- No exponer PostgreSQL a Internet.
- No publicar `.env.local`.
- No almacenar claves de Azure.
- No activar carga de documentos desde la interfaz hasta aprobar las pruebas de autorización.
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

Ejecutar:

```bash
npm run local:status
```

Esperar hasta que `postgres` aparezca como `healthy` y volver a ejecutar `npm run db:migrate`.

### Reconstrucción completa

```bash
npm run local:reset
```

Este comando destruye y recrea únicamente la base local y los datos ficticios.
