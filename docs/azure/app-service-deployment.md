# Despliegue de la aplicación en Azure App Service

## Estado

El workflow de despliegue está preparado, pero no debe ejecutarse hasta que la infraestructura de desarrollo exista, el crédito esté confirmado y el Environment `development` tenga aprobación manual.

El flujo usa OpenID Connect. No utiliza publish profiles, contraseñas de service principal ni credenciales permanentes de Azure.

## Identidad dedicada

La identidad federada de despliegue debe ser distinta de la identidad usada para `what-if` y de la identidad de operaciones documentales.

Su credencial federada confía en:

```text
repo:<propietario>/<repositorio>:environment:development
```

El Environment `development` requiere:

### Secretos

- `AZURE_DEPLOY_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Los tres valores son identificadores de la autenticación OIDC. No contienen una contraseña reutilizable.

### Variables

- `AZURE_WEB_APP_NAME`
- `AZURE_APP_URL`

`AZURE_APP_URL` debe usar HTTPS y corresponder exactamente a la aplicación indicada por `AZURE_WEB_APP_NAME`.

## Permiso mínimo

Al desplegar la infraestructura se proporciona `applicationDeploymentPrincipalId` con el Object ID del service principal federado. Bicep asigna `Website Contributor` únicamente sobre el App Service creado.

La identidad no recibe permisos sobre:

- App Service Plan;
- PostgreSQL;
- Storage;
- Key Vault;
- asignaciones RBAC;
- recursos de producción.

La identidad que aplica Bicep necesita permisos para crear esta asignación. El principal de despliegue no puede concederse permisos a sí mismo.

## Flujo manual

El workflow `azure-app-deploy.yml`:

1. descarga el commit seleccionado;
2. instala dependencias con Node.js 22;
3. ejecuta TypeScript y el build de producción;
4. reúne `.next/standalone`, `.next/static` y `public`;
5. genera un ZIP y su SHA-256;
6. conserva el artefacto durante un día;
7. inicia sesión con OIDC;
8. despliega el ZIP mediante `azure/webapps-deploy@v3`;
9. exige que `/api/health` responda correctamente;
10. publica commit, aplicación, URL y resultado en el resumen.

La concurrencia está limitada a un despliegue de desarrollo. El workflow solo admite `workflow_dispatch`, por lo que un push a `main` no modifica Azure.

## Configuración del App Service

Bicep configura:

- Node.js 22 LTS sobre Linux;
- `node server.js` como comando de inicio;
- paquete standalone precompilado;
- HTTPS obligatorio;
- FTP desactivado;
- HTTP/2 y TLS 1.2;
- telemetría de Next.js desactivada;
- Application Insights;
- `APP_ENV` y URL pública del entorno;
- proveedores y referencias de Key Vault del entorno.

El plan F1 no ofrece `Always On`. La primera petición puede tardar más después de un periodo sin uso; el health check contempla el arranque en frío.

## Aprobación

Antes del primer despliegue:

- revisar el último `what-if`;
- confirmar que los recursos existen y pertenecen a Azure for Students;
- revisar presupuesto, alertas y crédito disponible;
- activar required reviewers en el Environment `development`;
- comprobar que PostgreSQL y Entra están configurados para las páginas privadas;
- mantener únicamente usuarios y documentos ficticios.

## Rollback

El plan F1 no dispone de slots de despliegue. Para volver a una versión anterior:

1. identificar el último commit saludable;
2. abrir **Desplegar aplicación Azure**;
3. seleccionar ese commit o tag como referencia del workflow;
4. aprobar el Environment;
5. verificar nuevamente `/api/health`.

No se debe reescribir `main` para hacer rollback. En una suscripción comercial se debe migrar a un plan con slot de staging y swap controlado.

## Evidencia

El despliegue se considera aprobado cuando:

- el workflow termina correctamente;
- el SHA-256 del artefacto es válido;
- `/api/health` responde desde la URL Azure;
- Application Insights recibe solicitudes sin datos sensibles;
- el panel usa únicamente identidades y datos ficticios;
- existe un procedimiento de rollback probado.
