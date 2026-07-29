# Infraestructura Azure

Esta carpeta define la plataforma de Homologa Tú Mismo mediante Bicep.

## Alcance actual

El despliegue de desarrollo crea:

- Grupo de recursos `rg-homologa-dev`.
- App Service Linux con Node.js 22.
- App Service Plan F1 para pruebas.
- Storage Account sin acceso público a blobs ni claves compartidas.
- Contenedores privados `case-documents` y `generated-reports`.
- Key Vault con RBAC y borrado recuperable.
- Application Insights y Log Analytics.
- Identidad administrada para App Service.
- Permisos mínimos de la aplicación sobre Blob Storage y Key Vault.

La base de datos PostgreSQL y Microsoft Entra External ID se incorporarán en fases separadas después de revisar costos y adaptar el esquema.

## Región de desarrollo

La suscripción Azure for Students bloqueó las regiones europeas probadas y permitió `eastus`. Por ello, el entorno de desarrollo usa temporalmente **East US** y solamente datos ficticios. Ningún cliente, pago ni documento real se alojará allí.

Producción tendrá parámetros y suscripción independientes. Su región se elegirá según residencia de datos, cumplimiento, latencia, disponibilidad y costo.

## Validación local o en Cloud Shell

```bash
az bicep build --file infra/azure/main.bicep
az bicep build-params --file infra/azure/parameters/dev.bicepparam
```

Estos comandos compilan el código, pero no crean recursos.

## Vista previa antes de desplegar

```bash
az deployment sub what-if \
  --location eastus \
  --template-file infra/azure/main.bicep \
  --parameters infra/azure/parameters/dev.bicepparam
```

## Despliegue

No ejecutar hasta haber creado un presupuesto y revisado la salida de `what-if`.

```bash
az deployment sub create \
  --name homologa-dev-foundation \
  --location eastus \
  --template-file infra/azure/main.bicep \
  --parameters infra/azure/parameters/dev.bicepparam
```

## Producción

Producción tendrá un archivo de parámetros independiente, una suscripción comercial y un grupo de recursos separado. No se desplegará sobre F1 y requerirá aprobación manual, presupuesto, dominio, pruebas de aceptación y controles de continuidad.
