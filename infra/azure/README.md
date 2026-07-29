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

La directiva `Allowed resource deployment regions` de Azure for Students permite `chilecentral`, `mexicocentral`, `centralus`, `southcentralus` y `eastus`. La simulación completa `what-if` rechazó `eastus` por disponibilidad regional y validó correctamente **Chile Central** con 12 recursos previstos.

Por ello, el entorno de desarrollo usa temporalmente `chilecentral` y solamente datos ficticios. Ningún cliente, pago ni documento real se alojará en la suscripción estudiantil.

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
  --location chilecentral \
  --template-file infra/azure/main.bicep \
  --parameters infra/azure/parameters/dev.bicepparam
```

La última simulación aprobada mostró `Resource changes: 12 to create`.

## Despliegue

No ejecutar hasta haber creado un presupuesto, revisado la salida de `what-if` y obtenido autorización expresa del propietario.

```bash
az deployment sub create \
  --name homologa-dev-foundation \
  --location chilecentral \
  --template-file infra/azure/main.bicep \
  --parameters infra/azure/parameters/dev.bicepparam
```

## Producción

Producción tendrá un archivo de parámetros independiente, una suscripción comercial y un grupo de recursos separado. No se desplegará sobre F1 y requerirá aprobación manual, presupuesto, dominio, pruebas de aceptación y controles de continuidad.
