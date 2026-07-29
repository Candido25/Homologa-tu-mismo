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
- Key Vault con RBAC y borrado recuperable.
- Application Insights y Log Analytics.
- Identidad administrada para App Service.
- Permisos mínimos de la aplicación sobre Blob Storage y Key Vault.
- Azure Database for PostgreSQL Flexible Server opcional, desactivado por defecto en `dev.bicepparam`.
- Secreto `database-url` en Key Vault cuando PostgreSQL se despliega.

Microsoft Entra External ID todavía no forma parte de la plantilla porque requiere configuración de tenant y flujos fuera del alcance básico de Bicep.

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

Para incluir PostgreSQL en la simulación o despliegue de desarrollo, pasar parámetros explícitos y una contraseña segura fuera del repositorio:

```bash
az deployment sub what-if \
  --location chilecentral \
  --template-file infra/azure/main.bicep \
  --parameters infra/azure/parameters/dev.bicepparam \
  --parameters deployPostgres=true postgresAdminPassword='REEMPLAZAR_EN_TERMINAL'
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
