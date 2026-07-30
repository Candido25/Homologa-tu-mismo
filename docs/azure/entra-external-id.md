# Microsoft Entra External ID

## Estado

El tenant externo, la aplicación web, el flujo de usuario y la credencial de desarrollo ya están configurados. La aplicación incluye el flujo OpenID Connect para clientes mediante MSAL Node, pero permanece desactivado hasta disponer de PostgreSQL y completar la prueba integral con cuentas ficticias.

Recursos actuales:

- tenant: `Homologa Tu Mismo`;
- dominio: `homologatumismo.onmicrosoft.com`;
- directory tenant ID: `dd9ae613-fadb-40ea-b39d-90f558d10290`;
- aplicación: `homologa-tu-mismo-web`;
- application client ID: `13041d58-48a1-4b6d-82c2-1297bf1e8bd7`;
- flujo de usuario: `RegistroInicioSesion`;
- grupo de recursos de identidad: `rg-homologa-identity`;
- suscripción asociada: `Homologa Tu Mismo - PAYG`;
- Key Vault de desarrollo: `kv-homologa-dev-mv6rxx`;
- secreto de desarrollo: `entra-client-secret`, habilitado y con rotación requerida antes del 28 de octubre de 2026.

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

1. ~~Un tenant de Microsoft Entra External ID.~~ Completado.
2. ~~Una aplicación web registrada dentro de ese tenant.~~ Completado.
3. ~~Un flujo de usuario de registro e inicio de sesión.~~ Completado.
4. ~~Una credencial de desarrollo para la aplicación, almacenada directamente en Key Vault.~~ Completado.

La creación del tenant puede requerir asociar una suscripción y aceptar condiciones de facturación. No debe ejecutarse sin aprobación explícita.

## Configuración del tenant

En el centro de administración de Microsoft Entra:

1. Seleccionar el tenant External `Homologa Tu Mismo`.
2. Abrir la aplicación web `homologa-tu-mismo-web`.
3. Verificar las URI de redirección:

```text
http://localhost:3000/auth/entra/callback
https://app-homologa-dev-mv6rxx.azurewebsites.net/auth/entra/callback
```

Las dos URI están registradas como plataforma Web. No están activados el flujo implícito ni el flujo híbrido.

El flujo `RegistroInicioSesion` usa correo electrónico con contraseña, recopila únicamente `Email Address` y `Display Name`, y está asociado a `homologa-tu-mismo-web`. La ejecución preliminar validó la autoridad, la respuesta `code`, PKCE con `S256`, la URI de producción y la interfaz en español. La prueba completa con cuenta ficticia permanece pendiente hasta disponer de PostgreSQL.

4. Crear un flujo de usuario combinado de registro e inicio de sesión por correo.
5. Asociar la aplicación al flujo.
6. Incluir, como mínimo, los atributos `email` y `displayName`.
7. Probar confirmación de correo, acceso, cierre de sesión y recuperación de contraseña con cuentas ficticias.

## Identidad visual

Los activos preparados para la pantalla administrada por Microsoft están en `assets/branding/entra`:

- `banner-logo.png`: logotipo horizontal;
- `square-logo.png`: monograma cuadrado;
- `favicon.png`: icono de 32 px;
- `sign-in-background.png`: fondo de inicio de sesión.

También se conservan las fuentes SVG para poder regenerar los PNG. La carga en la personalización de marca del tenant permanece pendiente; no bloquea la validación técnica del flujo.

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
ENTRA_TENANT_ID=dd9ae613-fadb-40ea-b39d-90f558d10290
ENTRA_TENANT_SUBDOMAIN=homologatumismo
ENTRA_CLIENT_ID=13041d58-48a1-4b6d-82c2-1297bf1e8bd7
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
