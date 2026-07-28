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

## Validación local o en Cloud Shell

```bash
az bicep build --file infra/azure/main.bicep
az bicep build-params --file infra/azure/parameters/dev.bicepparam
```

Estos comandos compilan el código, pero no crean recursos.

## Vista previa antes de desplegar

```bash
az deployment sub what-if \
  --location westeurope \
  --template-file infra/azure/main.bicep \
  --parameters infra/azure/parameters/dev.bicepparam
```

## Despliegue

No ejecutar hasta haber creado un presupuesto y revisado la salida de `what-if`.

```bash
az deployment sub create \
  --name homologa-dev-foundation \
  --location westeurope \
  --template-file infra/azure/main.bicep \
  --parameters infra/azure/parameters/dev.bicepparam
```

## Producción

Producción tendrá un archivo de parámetros independiente y un grupo de recursos separado. No se desplegará sobre F1 y requerirá aprobación manual, presupuesto, dominio y plan de continuidad posterior a Azure for Students.
