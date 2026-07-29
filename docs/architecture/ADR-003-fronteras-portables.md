# ADR-003 — Fronteras portables para identidad, datos y documentos

- **Estado:** Aceptado
- **Fecha:** 2026-07-29
- **Decisión relacionada:** ADR-002

## Contexto

La primera versión de la aplicación accedía directamente a Supabase Auth, PostgreSQL y Storage. Esa integración permitió validar el flujo inicial, pero acopló las páginas y rutas de la aplicación a un proveedor concreto.

La plataforma definitiva usará servicios administrados de Azure. Sin embargo, la lógica de negocio no debe depender directamente de MSAL, Microsoft Entra External ID, Azure Database for PostgreSQL ni Azure Blob Storage. Mantener fronteras explícitas reduce el riesgo de una migración futura, permite probar sin consumir crédito y evita que una incidencia de un SDK se propague por toda la aplicación.

## Decisión

Se adopta una arquitectura de **puertos y adaptadores dentro del monolito modular**.

### Identidad

- Homologa Tú Mismo tendrá un identificador interno UUID para cada usuario.
- Las identidades externas se almacenarán en `external_identities` mediante `provider`, `issuer` y `subject`.
- El código de negocio solo conocerá `AuthenticatedUser` y `CurrentUserProvider`.
- El subject de Entra, Supabase u otro proveedor nunca será la clave primaria de los expedientes.

### Base de datos

- El esquema canónico será PostgreSQL estándar en `database/migrations/`.
- No contendrá referencias a `auth.users`, funciones `auth.uid()` ni esquemas especiales de Supabase.
- Los repositorios siempre recibirán el `userId` interno y filtrarán por propietario.
- El navegador no tendrá conexión directa a PostgreSQL.
- La aplicación servidor será la única capa de acceso a datos desde Internet.

### Documentos

- La lógica de negocio utilizará el contrato `DocumentStorage`.
- Desarrollo local usará Azurite.
- Azure usará Blob Storage privado mediante identidad administrada.
- La base de datos guardará proveedor, contenedor y ruta; no guardará URLs públicas.
- Ninguna implementación podrá habilitar acceso anónimo a los contenedores.

### Expedientes

- La lógica utilizará `CaseRepository`.
- Las operaciones de lectura y modificación exigirán simultáneamente el identificador del expediente y el propietario.
- Los errores de autorización no revelarán si un expediente de otro usuario existe.

## Entorno local

El entorno local se ejecutará con Docker Compose:

- PostgreSQL 16.
- Azurite para Blob, Queue y Table.
- Usuarios y expedientes completamente ficticios.
- Migraciones y semillas reproducibles desde el repositorio.

No se crearán recursos de Azure para desarrollar o probar esta fase.

## Consecuencias

### Positivas

- Las pruebas locales no consumen el crédito estudiantil.
- La migración de Supabase puede hacerse módulo por módulo.
- Azure puede reemplazarse sin reescribir la lógica de diagnóstico y expedientes.
- La identidad interna permanece estable aunque cambie el proveedor de acceso.
- Los límites de seguridad pueden probarse con dos usuarios ficticios.

### Costos y riesgos

- Se añaden interfaces y adaptadores que requieren disciplina arquitectónica.
- Durante la transición coexistirán temporalmente el código Supabase heredado y la nueva capa portable.
- El aislamiento debe probarse tanto en los repositorios como en la configuración de PostgreSQL.

## Reglas de implementación

1. No importar SDK de proveedor dentro de `src/core/`.
2. No construir rutas de Blob fuera del adaptador de almacenamiento.
3. No consultar expedientes sin filtrar por `userId`.
4. No usar correos electrónicos como identificador interno.
5. No introducir claves de cuenta o secretos en variables `NEXT_PUBLIC_*`.
6. No desplegar recursos hasta aprobar pruebas locales y estimación de costos.
