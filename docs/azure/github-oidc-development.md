# GitHub OIDC para Azure Students

## Objetivo

Permitir que GitHub Actions ejecute `what-if` contra Azure sin guardar contraseñas ni credenciales permanentes en el repositorio.

## Resultado esperado

- GitHub Environment: `development`.
- Secrets del environment:
  - `AZURE_CLIENT_ID`
  - `AZURE_TENANT_ID`
  - `AZURE_SUBSCRIPTION_ID`
- Una aplicación o identidad federada en Microsoft Entra ID.
- Permisos mínimos para ejecutar `az deployment sub what-if`.

## Configuración en GitHub

1. Abrir el repositorio `Candido25/Homologa-tu-mismo`.
2. Ir a **Settings > Environments**.
3. Crear el environment `development`.
4. Activar aprobación manual si se va a permitir despliegue real más adelante.
5. Crear los secrets del environment:
   - `AZURE_CLIENT_ID`: client id de la aplicación registrada en Entra.
   - `AZURE_TENANT_ID`: tenant id de Entra.
   - `AZURE_SUBSCRIPTION_ID`: id de la suscripción Azure for Students.

El `what-if` con PostgreSQL genera una contraseña efímera dentro del runner, la oculta en los registros y la descarta al terminar. No requiere conservar `POSTGRES_ADMIN_PASSWORD` en GitHub.

## Configuración en Azure

1. Crear o seleccionar una App Registration para GitHub Actions.
2. Crear una credencial federada con estos datos:

```text
Issuer: https://token.actions.githubusercontent.com
Subject: repo:Candido25@115950054/Homologa-tu-mismo@1315110497:environment:development
Audience: api://AzureADTokenExchange
```

Este repositorio personalizó el claim para incluir los IDs inmutables del propietario y del repositorio. Los Environments `development-deployment` y `development-operations` deben conservar el mismo prefijo y cambiar únicamente el nombre final del Environment.

3. Asignar permisos mínimos sobre la suscripción Azure for Students.

Para `what-if` a nivel suscripción se necesita lectura de la suscripción y capacidad de validar despliegues. Para despliegue real se necesitará un rol más amplio, como Contributor, pero no debe concederse hasta aprobar el flujo de creación.

## Uso

1. Ir a **Actions > Azure what-if**.
2. Seleccionar **Run workflow**.
3. Para simulación sin base de datos:

```text
deployPostgres=false
appServiceSku=F1
```

4. Para simulación con PostgreSQL mínimo:

```text
deployPostgres=true
appServiceSku=F1
postgresSkuName=B_Standard_B1ms
```

5. Revisar la salida `Resource changes`.
6. No ejecutar despliegue real hasta entender costo, región, nombres globales y recursos creados.

## Control de gasto

- Mantener App Service en `F1` mientras sea posible.
- Mantener PostgreSQL desactivado hasta necesitar integración real.
- Cuando PostgreSQL se active, usar `B_Standard_B1ms` y apagar o eliminar recursos si no se usan.
- Revisar Cost Management después de cada simulación o despliegue.
- Mantener alertas al 50 %, 80 % y 100 % del crédito disponible.

## Identidad para operaciones documentales

La retención programada y la prueba manual de recuperación utilizan un Environment separado llamado `development-operations`. Su credencial federada debe usar el subject:

```text
repo:<propietario>/<repositorio>:environment:development-operations
```

Esta identidad no conserva el token de retención en GitHub: lo lee temporalmente desde el secreto específico de Key Vault mediante OIDC. La configuración, variables y permisos mínimos se detallan en [`document-operations.md`](document-operations.md).

## Identidad para despliegue de aplicación

El workflow de App Service usa otra identidad federada y el secreto `AZURE_DEPLOY_CLIENT_ID`. Bicep le asigna `Website Contributor` únicamente sobre la aplicación mediante `applicationDeploymentPrincipalId`.

El Environment `development-deployment` debe limitarse a `main` y exigir aprobación manual antes de permitir el job de despliegue. La guía completa está en [`app-service-deployment.md`](app-service-deployment.md).
