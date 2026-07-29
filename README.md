# Homologa Tú Mismo

**Tu título, tu trámite, nuestra guía.**

Aplicación web orientada a ayudar a profesionales latinoamericanos a identificar, preparar y organizar sus trámites de homologación, equivalencia o convalidación de títulos en España.

> Plataforma privada e independiente. No pertenece al Gobierno de España y no garantiza la aprobación de ningún trámite.

## Estado

**Preparación arquitectónica sin consumo de Azure.**

La versión actual incluye:

- Página pública y diagnóstico preliminar.
- Panel privado y expedientes construidos inicialmente sobre Supabase.
- Modelo de datos para usuarios, expedientes, requisitos, documentos, revisiones y auditoría.
- Infraestructura Azure descrita mediante Bicep y validada con `what-if` en Chile Central.
- Presupuesto y alertas de consumo configurados en Azure for Students.
- Congelamiento de despliegue: no se crearán recursos hasta concluir pruebas locales y estimación de costos.
- Esquema PostgreSQL portable sin referencias a `auth.users` ni `auth.uid()`.
- Entorno local reproducible con PostgreSQL y Azurite.
- Contratos independientes del proveedor para identidad, expedientes y documentos.

## Arquitectura objetivo

Homologa Tú Mismo seguirá siendo un **monolito modular**. La producción comercial usará una suscripción Azure independiente de la suscripción estudiantil.

```text
Next.js 16 + React 19 + TypeScript
├── Microsoft Entra External ID
├── Azure Database for PostgreSQL Flexible Server
├── Azure Blob Storage privado
├── Azure Key Vault
├── Application Insights y Azure Monitor
└── GitHub Actions con OpenID Connect y aprobación manual
```

La lógica de negocio no importará directamente SDK de Microsoft, Supabase ni otro proveedor. La aplicación utilizará fronteras portables:

- `CurrentUserProvider`
- `CaseRepository`
- `DocumentStorage`

Las decisiones están documentadas en:

- [`ADR-002 — Plataforma integral Azure`](docs/architecture/ADR-002-plataforma-integral-azure.md)
- [`ADR-003 — Fronteras portables`](docs/architecture/ADR-003-fronteras-portables.md)

## Regla de control de gasto

No se ejecutará ningún despliegue real mientras falten:

1. Pruebas locales de aislamiento entre dos usuarios.
2. Adaptadores portables de identidad, PostgreSQL y documentos.
3. Estimación mensual por servicio.
4. Revisión de RBAC, redes, respaldos y restauración.
5. Workflow con aprobación manual.
6. Autorización expresa del propietario.

Los comandos permitidos durante esta fase son compilación, validación y `what-if`. No se autoriza `az deployment ... create`.

## Desarrollo local sin Azure

### Requisitos

- Node.js 22.
- Docker Desktop con Docker Compose v2.
- Git.

### Inicio

```bash
npm install
cp .env.example .env.local
npm run local:up
npm run db:migrate
npm run db:seed
npm run db:verify
npm run dev
```

En PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Abrir `http://localhost:3000`.

### Servicios locales

- PostgreSQL: `localhost:5432`
- Azurite Blob: `localhost:10000`
- Azurite Queue: `localhost:10001`
- Azurite Table: `localhost:10002`

Todos los datos incluidos son ficticios. La guía completa está en [`docs/development/local-environment.md`](docs/development/local-environment.md).

## Comandos principales

```bash
npm run typecheck
npm run build
npm run local:up
npm run local:status
npm run db:migrate
npm run db:seed
npm run db:verify
npm run local:down
npm run local:reset
```

## Modelo PostgreSQL portable

El esquema canónico está en:

```text
database/migrations/0001_portable_core.sql
```

Principios:

- UUID interno para cada usuario.
- Identidades externas separadas por proveedor, issuer y subject.
- PostgreSQL no depende del sistema de autenticación.
- Los expedientes y documentos conservan propietario interno.
- Las rutas de almacenamiento guardan proveedor, contenedor y objeto; nunca una URL pública.
- El navegador no tendrá acceso directo a la base de datos.

Las migraciones de `supabase/migrations/` se conservan temporalmente como referencia histórica mientras termina la sustitución del código heredado.

## Principios del producto

1. Las reglas verificables determinan la ruta; la IA la explica.
2. La IA no certifica autenticidad ni garantiza aprobación.
3. Los documentos permanecen privados y se autorizan desde el servidor.
4. Los procesos pesados se ejecutan fuera de la petición web.
5. Cada recomendación relevante conserva fuente, versión y nivel de confianza.
6. Seguridad y privacidad se validan antes de recibir documentos reales.
7. La suscripción Azure for Students solo utiliza datos ficticios.

## Próximas fases sin consumo

1. Implementar adaptador PostgreSQL local.
2. Implementar identidad local ficticia mediante `CurrentUserProvider`.
3. Sustituir consultas Supabase de expedientes por `CaseRepository`.
4. Implementar Blob Storage local sobre Azurite.
5. Probar aislamiento, MIME, tamaño, hash, retención y eliminación.
6. Añadir PostgreSQL al Bicep después de aprobar SKU y costo.
7. Preparar GitHub OIDC y workflow con aprobación manual.

## Propiedad

Copyright © 2026 Omar Oswaldo Alcantara Aquino. Todos los derechos reservados.
