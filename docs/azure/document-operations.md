# Operación documental en Azure

## Objetivo

Ejecutar la retención documental de forma programada y comprobar la recuperación ante borrados accidentales sin guardar el token operativo en GitHub ni utilizar documentos reales.

La recuperación de Blob Storage está activa y fue validada con un archivo ficticio. La retención programada permanece preparada pero desactivada hasta desplegar PostgreSQL y crear el token operativo.

## Componentes

- App Service expone `POST /api/internal/retencion-documental`.
- Key Vault conserva `document-retention-job-token`.
- App Service recibe el token mediante una referencia de Key Vault y su identidad administrada.
- GitHub Actions obtiene temporalmente el mismo secreto después de autenticarse con OIDC.
- Blob Storage mantiene borrado recuperable durante 30 días.
- Application Insights recibe los eventos agregados del proceso, sin nombres de archivo ni contenido.

## Entorno de GitHub

El Environment independiente `development-operations` acepta únicamente `main`, está configurado con OIDC y no comparte credenciales con producción.

Configurar estos secretos:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Estos valores identifican la aplicación federada; el token de retención no se almacena en GitHub.

Configurar estas variables:

- `AZURE_APP_URL`: URL HTTPS del App Service.
- `AZURE_KEY_VAULT_NAME`: nombre del Key Vault del entorno.
- `AZURE_STORAGE_ACCOUNT_NAME`: cuenta usada exclusivamente para datos ficticios de desarrollo.

La credencial federada de Entra debe confiar en:

```text
repo:Candido25@115950054/Homologa-tu-mismo@1315110497:environment:development-operations
```

El subject usa los IDs inmutables del propietario y del repositorio que GitHub incluye en este proyecto.

## Permisos mínimos

Al activar la retención se proporcionarán fuera del repositorio:

- `documentRetentionJobToken`: valor aleatorio de 32 bytes o más.
- `documentOperationsPrincipalId`: Object ID del service principal federado, no su Client ID.

La plantilla limita esa identidad a:

- `Storage Blob Data Contributor` sobre la cuenta de desarrollo, necesario para la prueba de recuperación;
- `Key Vault Secrets User` sobre `document-retention-job-token`, no sobre todo el Key Vault.

En el despliegue actual solo se materializó `Storage Blob Data Contributor`, porque el token y su secreto continúan ausentes.

La identidad administrada del App Service conserva sus propios permisos sobre Storage y Key Vault. En producción deben utilizarse una identidad, un Environment y aprobaciones independientes.

## Retención programada

El workflow `azure-document-retention.yml` se ejecuta diariamente a las `08:23 UTC` y también admite ejecución manual. Cada ejecución:

1. inicia sesión en Azure con OIDC;
2. obtiene el token desde Key Vault;
3. llama al endpoint interno únicamente por HTTPS;
4. aplica reintentos y un límite de tiempo;
5. exige respuesta `200`, `ok=true` y `failed=0`;
6. publica cantidades agregadas de revisados, eliminados, omitidos y fallidos.

El workflow usa concurrencia exclusiva para impedir dos lotes simultáneos. GitHub conserva el resultado del job y App Service registra `document_retention_job_completed` o `document_retention_job_failed` para consulta en Application Insights.

Antes de considerar la operación activa se debe ejecutar el workflow manualmente, confirmar una entrada satisfactoria en Application Insights y configurar una alerta por fallo o ausencia de ejecución.

## Alertas preparadas

Bicep puede crear dos reglas de consulta:

- severidad 1 cuando aparece `document_retention_job_failed` o `document_retention_delete_failed`;
- severidad 2 cuando no aparece `document_retention_job_completed` durante 26 horas.

Las reglas y su Action Group permanecen desactivadas por defecto a nivel de plantilla. Después de una primera ejecución correcta se habilitan mediante:

```text
enableDocumentRetentionAlerts=true
operationsAlertEmail=<correo operativo>
```

`operationsAlertEmail` es un parámetro seguro y no debe guardarse en el archivo `.bicepparam`. Activar consultas programadas puede generar consumo en Azure Monitor, por lo que requiere revisar presupuesto y `what-if`.

## Recuperación de Blob Storage

El workflow manual `azure-document-recovery.yml` ejecuta:

```bash
npm run azure:verify-recovery
```

La prueba:

1. carga un PDF mínimo y ficticio bajo `_operations/recovery-tests/`;
2. registra su SHA-256;
3. elimina el blob y confirma que dejó de estar disponible;
4. ejecuta `undelete`;
5. verifica contenido, hash y metadatos;
6. vuelve a eliminar el objeto de prueba.

La prueba requiere `AZURE_RECOVERY_TEST_ALLOWED=true`, OIDC y permisos de datos. Nunca debe apuntar a producción ni utilizar archivos de usuarios.

## Ventana de desaparición definitiva

La fecha `retention_until` determina cuándo la aplicación retira el documento y marca sus metadatos como eliminados. En Azure, Blob Soft Delete conserva internamente el objeto eliminado durante 30 días adicionales para recuperación operativa; durante ese periodo no está disponible por el flujo normal de usuario.

Al finalizar esa ventana Azure lo elimina definitivamente. El objeto ficticio usado por la prueba también permanece en estado soft-deleted hasta completar ese plazo. Esta ventana debe aparecer en la política de privacidad y revisarse antes de recibir datos reales.

## Evidencia de activación

La fase se considera operativa solo cuando existan:

- ejecución manual satisfactoria de retención;
- ejecución manual satisfactoria de recuperación;
- evidencia en Application Insights sin datos sensibles;
- alerta operativa probada;
- revisión del coste y del crédito de Azure for Students.

Evidencia actual:

- recuperación manual `30465696093`: aprobada;
- autenticación OIDC de operaciones: aprobada;
- carga, eliminación, `undelete` e integridad SHA-256: aprobadas;
- retención, secreto y alertas: pendientes.
