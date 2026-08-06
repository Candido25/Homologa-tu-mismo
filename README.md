# Homologa Tú Mismo

**Tu título, tu trámite, nuestra guía.**

Aplicación web orientada a ayudar a profesionales latinoamericanos a identificar, preparar y organizar sus trámites de homologación, equivalencia o convalidación de títulos en España.

> Plataforma privada e independiente. No pertenece al Gobierno de España y no garantiza la aprobación de ningún trámite.

## Estado

**Transición activa a GitHub + Vercel + Supabase, con Azure conservado solo como histórico.**

La versión actual incluye:

- Página pública y diagnóstico preliminar.
- Panel privado y expedientes construidos inicialmente sobre Supabase.
- Modelo de datos para usuarios, expedientes, requisitos, documentos, revisiones y auditoría.
- Arquitectura activa documentada en ADR-004: GitHub, Vercel y Supabase.
- Documentación Azure conservada únicamente como antecedente histórico, no como camino operativo vigente.
- Esquema PostgreSQL portable sin referencias a `auth.users` ni `auth.uid()`.
- Entorno local reproducible con PostgreSQL y Azurite.
- Contratos independientes del proveedor para identidad, expedientes y documentos.
- API documental privada para archivos ficticios, con metadatos PostgreSQL y contenido en Azurite.
- Gestor documental local para cargar, versionar, descargar y eliminar archivos ficticios.
- Retención automática portable con vencimiento, borrado físico y auditoría mínima.
- Automatización diaria Azure preparada con OIDC, Key Vault y métricas agregadas.
- Prueba manual de borrado recuperable preparada para Blob Storage con archivos ficticios.
- Despliegue manual de App Service preparado con artefacto standalone, OIDC, health check y rollback documentado.
- Alertas Azure de retención preparadas y desactivadas hasta aprobar su coste y destinatario.
- Validación automatizada de propietario, origen, MIME y firma binaria, tamaño, hash, lectura y eliminación.

## Arquitectura objetivo

Homologa Tú Mismo seguirá siendo un **monolito modular**. La primera etapa aprovechará Azure for Students y GitHub Education; cuando existan clientes reales, pagos o documentos sensibles reales, se migrará o escalará a una suscripción Azure de pago con presupuestos propios.

```text
Next.js 16 + React 19 + TypeScript
├── Supabase Auth
├── Supabase PostgreSQL
├── Supabase Storage privado
├── Vercel
└── GitHub Actions
```

La lógica de negocio no importará directamente SDK de Microsoft, Supabase ni otro proveedor. La aplicación utilizará fronteras portables:

- `CurrentUserProvider`
- `CaseRepository`
- `DocumentStorage`

Las decisiones están documentadas en:

- [`ADR-004 — GitHub + Vercel + Supabase sin Azure`](docs/architecture/ADR-004-vercel-supabase-sin-azure.md)
- [`ADR-003 — Fronteras portables`](docs/architecture/ADR-003-fronteras-portables.md)
La documentación Azure se conserva como histórico.

## Regla de control de gasto

Las capacidades todavía no autorizadas deben fallar cerradas:

1. documentos reales;
2. OCR/IA externa;
3. comunicaciones externas;
4. pagos reales;
5. revisión humana real;
6. datos personales reales;
7. PRD_2026.

## Desarrollo local sin Azure

### Requisitos

- Node.js 22.
- Docker Desktop con Docker Compose v2.
- Git.

### Inicio

```bash
npm ci
cp .env.example .env.local
npm run local:up
npm run db:migrate
npm run db:seed
npm run db:verify
npm test
npm run product:verify-controls
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
npm run documents:verify-local
npm run retention:verify-local
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

1. Confirmar saldo y renovación de Azure for Students y revisar el coste ingerido.
2. Configurar Microsoft Entra External ID.
3. Aprobar PostgreSQL `B_Standard_B1ms` y aplicar las migraciones portables.
4. Conectar las páginas privadas a los adaptadores Azure ya preparados.
5. Ejecutar la retención documental con datos ficticios.
6. Activar y probar las alertas por fallo o ausencia de retención.
7. Probar rollback y continuidad antes de incorporar datos reales.

## Propiedad

Copyright © 2026 Omar Oswaldo Alcantara Aquino. Todos los derechos reservados.
