# Infraestructura Azure

Esta carpeta define la plataforma de Homologa Tú Mismo mediante Bicep.

## Estado: congelamiento de despliegue

La infraestructura puede compilarse, validarse y revisarse con `what-if`, pero **no debe desplegarse todavía**.

Queda prohibido ejecutar comandos `az deployment ... create` hasta completar:

- entorno local reproducible;
- adaptadores portables;
- pruebas de aislamiento;
- PostgreSQL y respaldo en el diseño;
- estimación mensual por servicio;
- revisión de RBAC y redes;
- workflow con aprobación manual;
- autorización expresa del propietario.

El `what-if` aprobado no constituye autorización de gasto.

## Alcance actual de la plantilla

La vista previa de desarrollo contiene:

- Grupo de recursos `rg-homologa-dev`.
- App Service Linux con Node.js 22.
- App Service Plan F1 para pruebas.
- Storage Account sin acceso público a blobs ni claves compartidas.
- Contenedores privados `case-documents` y `generated-reports`.
- Key Vault con RBAC y borrado recuperable.
- Application Insights y Log Analytics.
- Identidad administrada para App Service.
- Permisos mínimos de la aplicación sobre Blob Storage y Key Vault.

PostgreSQL y Microsoft Entra External ID todavía no forman parte de la plantilla. Se añadirán después de aprobar arquitectura, SKU y costo.

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

La última simulación aprobada mostró:

```text
Resource changes: 12 to create
```

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
