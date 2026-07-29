# Homologa Tú Mismo

**Tu título, tu trámite, nuestra guía.**

Aplicación web orientada a ayudar a profesionales latinoamericanos a identificar, preparar y organizar sus trámites de homologación, equivalencia o convalidación de títulos en España.

> Plataforma privada e independiente. No pertenece al Gobierno de España y no garantiza la aprobación de ningún trámite.

## Estado

**Preparación Azure-first con control estricto de crédito.**

La versión actual incluye:

- Página pública y diagnóstico preliminar.
- Panel privado y expedientes construidos inicialmente sobre Supabase.
- Modelo de datos para usuarios, expedientes, requisitos, documentos, revisiones y auditoría.
- Infraestructura Azure descrita mediante Bicep y validada con `what-if` en Chile Central.
- Presupuesto y alertas de consumo configurados en Azure for Students.
- Azure for Students será la plataforma inicial de construcción, validación y demostración del emprendimiento, aprovechando el crédito disponible.
- Esquema PostgreSQL portable sin referencias a `auth.users` ni `auth.uid()`.
- Entorno local reproducible con PostgreSQL y Azurite.
- Contratos independientes del proveedor para identidad, expedientes y documentos.

## Arquitectura objetivo

Homologa Tú Mismo seguirá siendo un **monolito modular**. La primera etapa aprovechará Azure for Students y GitHub Education; cuando existan clientes reales, pagos o documentos sensibles reales, se migrará o escalará a una suscripción Azure de pago con presupuestos propios.

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

Se permite preparar y validar infraestructura en Azure for Students siempre que se respeten estas reglas:

1. Usar primero los niveles gratuitos y SKU mínimos.
2. Mantener presupuestos y alertas de consumo.
3. No guardar secretos en GitHub ni en código.
4. Probar con datos ficticios mientras no existan controles completos.
5. Ejecutar `what-if` antes de crear o cambiar recursos costosos.
6. Pasar a suscripción pagada cuando el producto maneje clientes, pagos o documentos reales sensibles.

Los despliegues reales deben ser intencionales y revisados. El crédito estudiantil se tratará como capital inicial limitado del proyecto.

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
7. Azure for Students se aprovecha como entorno inicial del emprendimiento, con datos ficticios hasta aprobar seguridad, costos y continuidad.

## Próximas fases

1. Validar Bicep con PostgreSQL opcional.
2. Ejecutar `what-if` en Azure for Students antes de crear recursos.
3. Desplegar App Service, Storage, Key Vault, observabilidad y PostgreSQL mínimo cuando el crédito esté confirmado.
4. Aplicar migraciones portables en Azure PostgreSQL.
5. Configurar Microsoft Entra External ID.
6. Sustituir Supabase por adaptadores Azure.
7. Probar aislamiento, MIME, tamaño, hash, retención y eliminación.
8. Preparar GitHub OIDC y workflow con aprobación manual.

## Propiedad

Copyright © 2026 Omar Oswaldo Alcantara Aquino. Todos los derechos reservados.
