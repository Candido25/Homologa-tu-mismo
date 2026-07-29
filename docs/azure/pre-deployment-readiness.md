# Preparación para el primer despliegue Azure

## Estado al 29 de julio de 2026

La plataforma está preparada para un primer despliegue técnico con datos ficticios, pero no se han creado recursos Azure.

Evidencia comprobada:

- suscripción `Azure for Students` habilitada;
- ningún Resource Group existente;
- gasto mensual reportado: `USD 0.00`;
- presupuesto mensual: `USD 8.00`;
- alertas de presupuesto al 50, 75, 90 y 100 por ciento;
- usuario propietario con rol `Owner` sobre la suscripción;
- Bicep y parámetros compilados localmente y en GitHub Actions;
- build standalone ejecutado y validado mediante `/` y `/api/health`;
- CI de aplicación, PostgreSQL portable y Azurite aprobados;
- Environments de GitHub separados por simulación, despliegue y operaciones;
- despliegue restringido a `main` y revisión manual.

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

## Alcance recomendado para la primera aprobación

Crear únicamente la plataforma sin PostgreSQL, alertas documentales ni token de retención:

```text
appServiceSku=F1
deployPostgres=false
enableDocumentRetentionAlerts=false
documentRetentionJobToken=<vacío>
```

Este alcance permite validar:

- creación y nombres reales;
- identidad administrada;
- App Service público;
- Storage privado;
- Key Vault;
- observabilidad;
- despliegue standalone y health check.

El panel privado y las operaciones documentales Azure seguirán deshabilitados hasta configurar PostgreSQL, Entra, identidades OIDC y secretos.

La simulación local adicional con tu cuenta `Owner` y `assignManagedIdentityRoles=true` terminó correctamente:

```text
Resource changes: 12 to create
Potential changes: 2 to create
Status: Succeeded
```

Los dos recursos adicionales son las asignaciones `Storage Blob Data Contributor` y `Key Vault Secrets User` para la identidad administrada del App Service. Los cambios potenciales están condicionados al token y a la identidad de operaciones, que permanecen vacíos en este primer alcance.

## Acciones que requieren aprobación

- confirmar saldo disponible y fecha de renovación de Azure for Students;
- aceptar la creación de los 12 recursos simulados, incluidas dos asignaciones RBAC;
- crear identidades federadas separadas para despliegue y operaciones;
- retirar `POSTGRES_ADMIN_PASSWORD` del Environment `development`;
- ejecutar `az deployment sub create`;
- desplegar por primera vez la aplicación;
- revisar Cost Management inmediatamente después.

## Criterio de detención

Si el despliegue difiere del último `what-if`, intenta crear PostgreSQL, habilita alertas o solicita un SKU distinto de F1, se debe cancelar y revisar la plantilla antes de continuar.
