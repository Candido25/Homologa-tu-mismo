# PostgreSQL Azure de desarrollo

## Estado

La plantilla, las migraciones portables y el workflow OIDC están preparados, pero el servidor no está creado.

La identidad de migración ya está configurada:

```text
Aplicación: github-homologa-dev-database-migration
Client ID: 0d880356-db6d-4a35-b731-07f269bd10fe
Service principal Object ID: fb2026ee-63d1-443d-880d-2d62b547c7f9
GitHub Environment: development-database
```

El environment exige revisión manual, acepta únicamente `main` y contiene solo los identificadores OIDC y nombres de recursos previstos. No contiene una contraseña de PostgreSQL.

El `what-if` incremental aprobado prevé exactamente cuatro recursos:

1. PostgreSQL Flexible Server `psql-homologa-dev-mv6rxx`.
2. Base de datos `homologa`.
3. Regla de firewall `AllowAzureServices`.
4. Secreto `database-url` en Key Vault.

No se debe ejecutar el despliegue real hasta recibir aprobación explícita del costo.

## Costo estimado

Consulta realizada el 29 de julio de 2026 contra Azure Retail Prices API para `chilecentral`, en USD y modalidad de consumo:

| Componente | Tarifa | Estimación mensual |
| --- | ---: | ---: |
| Burstable B1ms | USD 0.0238/hora | USD 17.37 por 730 horas |
| Storage | USD 0.161/GiB/mes | USD 5.15 por 32 GiB |
| Backup dentro de 32 GiB | USD 0.00 | USD 0.00 |
| Total base encendido | | **USD 22.53/mes** |

La cifra es una estimación de precio minorista sin impuestos, descuentos ni consumo adicional. Debe confirmarse nuevamente antes de desplegar.

Al detener el servidor, Azure deja de cobrar cómputo, pero sigue cobrando almacenamiento y backup que exceda la cuota gratuita. Además, Flexible Server se inicia automáticamente después de siete días. Con un presupuesto mensual de USD 8, mantener este servidor encendido no es aceptable.

Referencias:

- [Azure Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices)
- [Facturación de un servidor detenido](https://learn.microsoft.com/en-us/azure/postgresql/backup-restore/concepts-backup-restore#how-am-i-billed-for-a-stopped-server)
- [Detener PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/how-to-stop-server)

## Estrategia de gasto

Para una validación temporal:

1. Crear el servidor solo durante una ventana aprobada.
2. Aplicar migraciones y datos de referencia ficticios.
3. Desplegar la aplicación y ejecutar las pruebas de aceptación.
4. Exportar la evidencia necesaria.
5. Eliminar el servidor al terminar la ventana.

Detenerlo reduce el costo de cómputo, pero no sustituye la eliminación cuando el recurso ya no se necesita.

## Identidad OIDC de migración

El workflow `.github/workflows/azure-postgres-migrate.yml` usa una identidad separada. Antes de ejecutarlo:

1. Crear una aplicación/identidad de migración en el tenant principal de Azure.
2. Agregar una credencial federada para:

```text
repo:Candido25@115950054/Homologa-tu-mismo@1315110497:environment:development-database
```

Este sujeto usa los identificadores inmutables del propietario y del repositorio para evitar que un cambio de nombre pueda transferir la confianza.

3. Pasar su Object ID como `databaseMigrationPrincipalId` en Bicep. Ya está configurado en `dev.bicepparam`.
4. Crear el GitHub Environment `development-database`, restringido a `main` y con aprobación manual. Ya está configurado.
5. Configurar estos secretos:

```text
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
```

6. Configurar estas variables:

```text
AZURE_RESOURCE_GROUP=rg-homologa-dev
AZURE_POSTGRES_SERVER_NAME=psql-homologa-dev-mv6rxx
AZURE_KEY_VAULT_NAME=kv-homologa-dev-mv6rxx
```

Bicep limita esta identidad a:

- `Contributor` sobre el servidor PostgreSQL, para administrar la regla temporal de firewall;
- `Key Vault Secrets User` sobre el secreto `database-url`.

## Migraciones

El comando portable aplica todas las migraciones numeradas de forma idempotente:

```bash
npm run db:migrate:portable
```

Para incluir países y tipos documentales:

```bash
npm run db:migrate:portable -- --seed-reference
```

El workflow manual:

1. autentica en Azure con OIDC;
2. obtiene la IPv4 pública del runner;
3. abre una regla de firewall con nombre único;
4. obtiene `database-url` desde Key Vault y la enmascara;
5. aplica las migraciones;
6. elimina la regla temporal incluso si falla la migración.

No introduce usuarios ni expedientes ficticios de prueba en Azure. Esos datos deben crearse mediante el flujo funcional aprobado.

## Verificación y cierre

Antes de considerar terminada la fase:

- confirmar `0001_portable_core` y `0002_auth_sessions` en `schema_migrations`;
- comprobar que el firewall temporal fue eliminado;
- validar dos identidades ficticias y aislamiento de expedientes;
- revisar App Service y Application Insights para descartar secretos o datos sensibles;
- comprobar el costo acumulado;
- detener o eliminar PostgreSQL según la ventana aprobada.
