# Primer despliegue Azure de desarrollo

## Estado al 29 de julio de 2026

La plataforma técnica de desarrollo está desplegada en Azure for Students con datos ficticios y sin PostgreSQL.

Evidencia comprobada:

- suscripción `Azure for Students` habilitada;
- Resource Group `rg-homologa-dev` creado en Chile Central;
- gasto mensual reportado: `USD 0.00`;
- presupuesto mensual: `USD 8.00`;
- alertas de presupuesto al 50, 75, 90 y 100 por ciento;
- usuario propietario con rol `Owner` sobre la suscripción;
- Bicep y parámetros compilados localmente y en GitHub Actions;
- App Service Linux `app-homologa-dev-mv6rxx` sobre plan `F1`;
- Storage privado `sthomologadevmv6rxx`;
- Key Vault `kv-homologa-dev-mv6rxx`;
- Application Insights y Log Analytics;
- build standalone desplegado y validado mediante `/` y `/api/health`;
- CI de aplicación, PostgreSQL portable y Azurite aprobados;
- identidades OIDC separadas para simulación, despliegue y operaciones;
- despliegue restringido a `main` y revisión manual;
- workflow de despliegue `30465077676`, intento 2, aprobado;
- workflow de recuperación documental `30465696093`, aprobado;
- PostgreSQL, token de retención y alertas documentales ausentes.

La consulta inmediata a Cost Management recibió `429 Too Many Requests`. El plan F1 y la ausencia de PostgreSQL reducen el consumo esperado, pero el coste real debe revisarse otra vez cuando Azure complete su ingestión.

## Simulación sin PostgreSQL

Workflow aprobado:

```text
Azure what-if / run 30458990790
```

Parámetros:

```text
environment=dev
location=chilecentral
appServiceSku=F1
deployPostgres=false
assignManagedIdentityRoles=false
enableDocumentRetentionAlerts=false
```

Resultado:

```text
Resource changes: 10 to create
Potential changes: 1 to create
```

Recursos previstos:

1. Resource Group `rg-homologa-dev`.
2. Application Insights.
3. Key Vault.
4. Log Analytics Workspace.
5. Storage Account.
6. Blob Service con soft delete.
7. Contenedor privado `case-documents`.
8. Contenedor privado `generated-reports`.
9. App Service Plan F1.
10. App Service Linux.

El cambio potencial es el secreto `document-retention-job-token`. `what-if` no puede evaluar por adelantado una condición basada en un parámetro seguro; con el valor vacío no debe crearse durante el primer despliegue.

## Simulación con PostgreSQL

Workflow aprobado:

```text
Azure what-if / run 30459637113
```

La simulación usa una contraseña aleatoria y efímera, oculta en los registros y descartada al terminar.

Resultado:

```text
Resource changes: 14 to create
Potential changes: 1 to create
```

Añade:

- PostgreSQL Flexible Server `B_Standard_B1ms`;
- base `homologa`;
- firewall para servicios Azure;
- secreto `database-url` en Key Vault.

PostgreSQL no se recomienda en el primer despliegue porque es el componente con mayor consumo esperado del crédito estudiantil.

### Revisión incremental del 29 de julio de 2026

Después del despliegue de la plataforma base, un nuevo `what-if` con PostgreSQL habilitado mostró cuatro creaciones:

1. PostgreSQL Flexible Server `psql-homologa-dev-mv6rxx`.
2. Base `homologa`.
3. Regla `AllowAzureServices`.
4. Secreto `database-url`.

Azure Retail Prices API reportó para Chile Central:

```text
B1ms: USD 0.0238/hora
Storage: USD 0.161/GiB/mes
Estimación 730 horas + 32 GiB: USD 22.53/mes
```

La estimación supera el presupuesto mensual de USD 8. PostgreSQL debe permanecer sin desplegar hasta aprobar una ventana temporal y un cierre mediante eliminación. La guía completa está en [`postgres-deployment.md`](./postgres-deployment.md).

## Alcance desplegado

Se creó únicamente la plataforma sin PostgreSQL, alertas documentales ni token de retención:

```text
appServiceSku=F1
deployPostgres=false
enableDocumentRetentionAlerts=false
documentRetentionJobToken=<vacío>
```

Este alcance permitió validar:

- creación y nombres reales;
- identidad administrada;
- App Service público;
- Storage privado;
- Key Vault;
- observabilidad;
- despliegue standalone y health check.

El panel privado seguirá sin persistencia Azure hasta configurar PostgreSQL y Entra External ID. La recuperación de Blob Storage está validada; la retención programada continúa desactivada hasta crear la base y el token operativo.

La simulación local adicional con tu cuenta `Owner` y `assignManagedIdentityRoles=true` terminó correctamente:

```text
Resource changes: 12 to create
Potential changes: 2 to create
Status: Succeeded
```

Los dos recursos adicionales son las asignaciones `Storage Blob Data Contributor` y `Key Vault Secrets User` para la identidad administrada del App Service.

El `what-if` final con las identidades OIDC reales terminó en `Succeeded` y mostró 14 creaciones. Los dos cambios potenciales estaban condicionados al token de retención vacío y no se materializaron.

## Acciones pendientes

- confirmar saldo disponible y fecha de renovación de Azure for Students;
- resolver la discrepancia de Azure Sponsorships;
- revisar Cost Management cuando el gasto reciente esté disponible;
- configurar PostgreSQL y Entra External ID antes de habilitar páginas privadas;
- crear la identidad OIDC y el environment `development-database` antes de migrar;
- crear el token de retención y probar alertas solo después de una ejecución manual correcta.

## Criterio de detención

Toda ampliación que intente crear PostgreSQL, habilitar alertas o cambiar el SKU F1 requiere un nuevo `what-if`, revisión de costes y aprobación explícita.
