# Microsoft Entra External ID

## Estado

La aplicación ya incluye el flujo OpenID Connect para clientes mediante MSAL Node, pero permanece desactivado hasta crear y configurar un tenant externo.

La integración implementada:

- usa Authorization Code Flow con PKCE, `state` y `nonce`;
- recibe el callback mediante `form_post`;
- valida `tid`, `aud`, `nonce`, emisor y sujeto estable;
- guarda únicamente el hash SHA-256 de una sesión opaca propia;
- no persiste access tokens, refresh tokens ni ID tokens;
- crea el usuario interno y enlaza `issuer` + `subject` en PostgreSQL;
- revoca la sesión local antes de cerrar la sesión de Entra;
- usa una cookie `HttpOnly`, `Secure`, `SameSite=Lax` y prefijo `__Host-` fuera del entorno local.

## Recursos que requieren aprobación

Antes de activar el proveedor se deben crear manualmente:

1. Un tenant de Microsoft Entra External ID.
2. Una aplicación web registrada dentro de ese tenant.
3. Un flujo de usuario de registro e inicio de sesión.
4. Una credencial de desarrollo para la aplicación.

La creación del tenant puede requerir asociar una suscripción y aceptar condiciones de facturación. No debe ejecutarse sin aprobación explícita.

## Configuración del tenant

En el centro de administración de Microsoft Entra:

1. Crear o seleccionar un tenant de tipo External.
2. Registrar una aplicación web para Homologa Tú Mismo.
3. Agregar las URI de redirección:

```text
http://localhost:3000/auth/entra/callback
https://app-homologa-dev-mv6rxx.azurewebsites.net/auth/entra/callback
```

4. Crear un flujo de usuario combinado de registro e inicio de sesión por correo.
5. Asociar la aplicación al flujo.
6. Incluir, como mínimo, los atributos `email` y `displayName`.
7. Probar confirmación de correo, acceso, cierre de sesión y recuperación de contraseña con cuentas ficticias.

La autoridad usada por la aplicación tiene este formato:

```text
https://<subdominio>.ciamlogin.com/
```

La metadata OIDC se obtiene desde:

```text
https://<subdominio>.ciamlogin.com/<subdominio>.onmicrosoft.com/v2.0/.well-known/openid-configuration
```

## Variables

La activación requiere todas estas variables y PostgreSQL disponible:

```text
AUTH_PROVIDER=entra
DATABASE_PROVIDER=postgres
DATABASE_URL=<secreto de Key Vault>
ENTRA_TENANT_ID=<directory tenant id>
ENTRA_TENANT_SUBDOMAIN=<subdominio sin onmicrosoft.com>
ENTRA_CLIENT_ID=<application client id>
ENTRA_CLIENT_SECRET=<referencia de Key Vault>
ENTRA_SESSION_HOURS=12
NEXT_PUBLIC_APP_URL=https://app-homologa-dev-mv6rxx.azurewebsites.net
```

Bicep configura estas variables únicamente cuando PostgreSQL y todos los parámetros de Entra están presentes. El secreto se almacena como `entra-client-secret` en Key Vault y App Service lo consume mediante una referencia, no como texto en el repositorio.

## Credencial

Un client secret es aceptable solo para esta fase de desarrollo y debe:

- crearse con la vigencia mínima razonable;
- guardarse directamente en Key Vault;
- no copiarse a GitHub, documentación, capturas ni registros;
- rotarse antes de vencer.

Antes de producción se debe sustituir por certificado o identidad federada.

## Validación

La prueba de aceptación debe cubrir:

1. Registro de una cuenta ficticia.
2. Confirmación de correo.
3. Inicio de sesión y redirección a `/panel`.
4. Persistencia del usuario en `app_users`, `external_identities` y `profiles`.
5. Presencia de una sesión en `auth_sessions` sin tokens de Entra almacenados.
6. Rechazo de `state` reutilizado o vencido.
7. Aislamiento de expedientes entre dos cuentas ficticias.
8. Cierre de sesión local y en Entra.
9. Recuperación de contraseña.

Referencias oficiales:

- [Tutorial de aplicación web Node.js con External ID](https://learn.microsoft.com/en-us/entra/external-id/customers/tutorial-web-app-node-sign-in-prepare-app)
- [Registro de una aplicación en un tenant externo](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-register-ciam-app)
- [Creación de un flujo de usuario](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-user-flow-sign-up-sign-in-customers)
