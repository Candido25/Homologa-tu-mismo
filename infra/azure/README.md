# Infraestructura Azure

Esta carpeta define la plataforma de Homologa Tú Mismo mediante Bicep.

## Estado: Azure Students primero, gasto controlado

La infraestructura puede compilarse, validarse y revisarse con `what-if`. Azure for Students se usará como plataforma inicial del emprendimiento, cuidando el crédito como presupuesto limitado.

Antes de ejecutar comandos `az deployment ... create` se debe confirmar:

- crédito y vigencia de Azure for Students;
- presupuesto y alertas activas;
- salida de `what-if` revisada;
- SKU elegido conscientemente;
- ausencia de secretos en Git;
- uso de datos ficticios hasta aprobar seguridad y continuidad.

El `what-if` aprobado no crea recursos; solo muestra el impacto esperado.

## Alcance actual de la plantilla

La vista previa de desarrollo contiene:

- Grupo de recursos `rg-homologa-dev`.
- App Service Linux con Node.js 22.
- App Service Plan F1 para pruebas.
- Storage Account sin acceso público a blobs ni claves compartidas.
- Contenedores privados `case-documents` y `generated-reports`.
- Borrado recuperable de blobs y contenedores durante 30 días.
- Key Vault con RBAC y borrado recuperable.
- Application Insights y Log Analytics.
- Identidad administrada para App Service.
- Permisos mínimos de la aplicación sobre Blob Storage y Key Vault.
- Azure Database for PostgreSQL Flexible Server opcional, desactivado por defecto en `dev.bicepparam`.
- Secreto `database-url` en Key Vault cuando PostgreSQL se despliega.
- Token de retención en Key Vault cuando se proporciona como parámetro seguro.
- Permisos acotados para la identidad federada de operaciones documentales.
- Permiso `Website Contributor` acotado al App Service para una identidad de despliegue independiente.
- Permisos acotados para una identidad OIDC de migración de PostgreSQL.
- Configuración condicional de Microsoft Entra External ID y secreto en Key Vault.
- Alertas de retención opcionales y desactivadas por defecto.

El tenant, el registro de aplicación y el flujo de usuario de Microsoft Entra External ID se configuran fuera de Bicep. La plantilla solo activa el proveedor después de recibir sus identificadores, la credencial de desarrollo y una base PostgreSQL.

## Región de desarrollo

La directiva `Allowed resource deployment regions` de Azure for Students permite `chilecentral`, `mexicocentral`, `centralus`, `southcentralus` y `eastus`.

La simulación completa rechazó `eastus` por disponibilidad regional y validó **Chile Central** con 12 recursos previstos. El entorno estudiantil solo podrá contener datos ficticios.

Producción tendrá parámetros, suscripción y región independientes.

## Compilación

```bash
az bicep build --file infra/azure/main.bicep
az bicep build-params --file infra/azure/parameters/dev.bicepparam
```

Estos comandos no crean recursos.

## Vista previa

```bash
az deployment sub what-if \
  --location chilecentral \
  --template-file infra/azure/main.bicep \
  --parameters infra/azure/parameters/dev.bicepparam
```

También existe el workflow manual **Azure what-if** en GitHub Actions. Requiere un GitHub Environment llamado `development` con estos secretos:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

La identidad federada de Azure debe confiar en el repositorio y en el environment `development`.

La guía paso a paso está en [`docs/azure/github-oidc-development.md`](../../docs/azure/github-oidc-development.md).

La programación de retención y la prueba de recuperación están descritas en [`docs/azure/document-operations.md`](../../docs/azure/document-operations.md). Ninguna de ellas crea recursos por sí sola; requieren que la plataforma haya sido desplegada y configurada.

El empaquetado standalone, despliegue OIDC, health check y rollback están descritos en [`docs/azure/app-service-deployment.md`](../../docs/azure/app-service-deployment.md). El workflow es exclusivamente manual y no se ejecuta con cada push.

La configuración del tenant externo está descrita en [`docs/azure/entra-external-id.md`](../../docs/azure/entra-external-id.md). El costo, la identidad OIDC y el procedimiento de migración de PostgreSQL están en [`docs/azure/postgres-deployment.md`](../../docs/azure/postgres-deployment.md).

El workflow manual ejecuta `what-if` con `assignManagedIdentityRoles=false` para no requerir permisos de administrador de acceso sobre la suscripción. El despliegue real debe revisar y activar las asignaciones RBAC de App Service a Storage y Key Vault.

Para incluir PostgreSQL en la simulación o despliegue de desarrollo, pasar parámetros explícitos y una contraseña segura fuera del repositorio:

```bash
az deployment sub what-if \
  --location chilecentral \
  --template-file infra/azure/main.bicep \
  --parameters infra/azure/parameters/dev.bicepparam \
  --parameters deployPostgres=true postgresAdminPassword='REEMPLAZAR_EN_TERMINAL'
```

La simulación aprobada el 29 de julio de 2026, con App Service `F1`, PostgreSQL desactivado, RBAC desactivado y alertas desactivadas, mostró:

```text
Resource changes: 10 to create
Potential changes: 1 to create
```

El cambio potencial corresponde a `document-retention-job-token`: Azure no puede resolver por adelantado la condición de un parámetro seguro. El despliegue real solo debe proporcionar ese token cuando Key Vault y la automatización documental vayan a activarse.

La simulación opcional con PostgreSQL `B_Standard_B1ms` también fue aprobada:

```text
Resource changes: 14 to create
Potential changes: 1 to create
```

El workflow genera una contraseña efímera para esta simulación y no necesita conservarla en GitHub. La evidencia y el alcance recomendado están en [`docs/azure/pre-deployment-readiness.md`](../../docs/azure/pre-deployment-readiness.md).

Las migraciones reales se ejecutan únicamente mediante el workflow manual **Migrar PostgreSQL Azure** y el environment protegido `development-database`. El runner abre una regla de firewall limitada a su IPv4, obtiene `database-url` desde Key Vault y elimina la regla al finalizar.

Una simulación local adicional, ejecutada con rol `Owner` y las asignaciones RBAC activadas, mostró:

```text
Resource changes: 12 to create
Potential changes: 2 to create
Status: Succeeded
```

Este es el conteo representativo del primer despliegue recomendado: 10 componentes de plataforma y 2 asignaciones de identidad administrada.

No se conserva en esta guía ningún comando de creación para reducir el riesgo de despliegue accidental.

## Producción

Producción requerirá:

- suscripción comercial;
- archivo de parámetros independiente;
- región aprobada por residencia de datos y latencia;
- plan distinto de F1;
- presupuesto y alertas propios;
- dominio y certificados;
- pruebas de aceptación, recuperación y continuidad;
- aprobación manual antes de cada despliegue de infraestructura.
