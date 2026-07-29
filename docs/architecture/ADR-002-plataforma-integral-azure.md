# ADR-002: Plataforma integral en Microsoft Azure

- **Estado:** Aceptado
- **Fecha:** 2026-07-28
- **Actualizado:** 2026-07-28
- **Sustituye parcialmente:** ADR-001 en lo relativo a Render y Supabase como plataforma de producción

## Contexto

Homologa Tú Mismo está todavía en fase inicial y no contiene usuarios ni expedientes reales. El producto está proyectado como una plataforma comercial que gestionará datos personales, expedientes y documentos académicos sensibles. Migrar la plataforma cuando ya existan clientes activos elevaría el riesgo de interrupción, pérdida de datos y afectación económica.

El propietario dispone de una suscripción denominada Azure for Students. Esta oferta se utilizará únicamente para aprendizaje, desarrollo, pruebas y demostración mientras se verifican su crédito, vigencia y condiciones. La producción comercial no dependerá de la suscripción estudiantil.

## Decisión

Azure será la plataforma principal. El desarrollo y las pruebas podrán ejecutarse en Azure for Students, pero la producción comercial deberá desplegarse en una suscripción de pago independiente antes de incorporar clientes o cobrar servicios. Los componentes se separan por responsabilidad:

- **Aplicación web:** Azure App Service para Next.js sobre Linux.
- **Base de datos:** Azure Database for PostgreSQL Flexible Server.
- **Identidad de clientes:** Microsoft Entra External ID en un tenant externo independiente.
- **Documentos:** Azure Blob Storage con contenedores privados.
- **Secretos:** Azure Key Vault con RBAC e identidad administrada.
- **Observabilidad:** Application Insights y Log Analytics.
- **Despliegue:** GitHub Actions con OpenID Connect, sin credenciales permanentes de Azure.
- **Infraestructura:** Bicep versionado en este repositorio.
- **Costos:** Azure Cost Management con presupuestos y alertas separados por suscripción.

## Principios

1. **Todo en Azure, no todo en una sola base de datos.** PostgreSQL almacena datos estructurados y metadatos; los archivos permanecen en Blob Storage.
2. **Desarrollo y producción separados.** Desarrollo usará `rg-homologa-dev`; producción usará `rg-homologa-prod` en una suscripción comercial independiente.
3. **La suscripción estudiantil no es producción.** No alojará clientes, pagos ni documentos reales.
4. **Sin secretos en GitHub ni en código.** App Service usará identidad administrada y Key Vault.
5. **Privacidad por defecto.** Los contenedores no permiten acceso público y la aplicación autoriza cada operación.
6. **Portabilidad.** PostgreSQL, Next.js y formatos estándar reducen la dependencia irreversible del proveedor.
7. **Infraestructura reproducible.** Ningún recurso esencial dependerá únicamente de configuraciones manuales del portal.
8. **Costo controlado.** Alta disponibilidad, redes privadas y escalado superior se activarán cuando el riesgo y los ingresos lo justifiquen.

## Topología objetivo

```text
GitHub
  ├── código Next.js
  ├── migraciones PostgreSQL
  ├── Bicep
  └── GitHub Actions con OIDC
          │
          ├── Desarrollo: Azure for Students
          │     └── rg-homologa-dev
          │
          └── Producción: suscripción comercial
                └── rg-homologa-prod

Azure App Service
  ├── identidad administrada
  ├── Application Insights
  ├── Azure Key Vault
  ├── Azure Blob Storage
  └── Azure Database for PostgreSQL

Microsoft Entra External ID
  └── registro e inicio de sesión de clientes
```

## Seguridad

- HTTPS obligatorio y TLS mínimo 1.2.
- FTP desactivado en App Service.
- Acceso anónimo a Blob Storage desactivado.
- RBAC para Storage y Key Vault.
- Identidad administrada para la aplicación.
- Confirmación de correo y recuperación de cuenta mediante Entra External ID.
- Registros sin contraseñas, tokens ni contenido documental.
- Ningún cliente, pago ni documento real se almacenará en Azure for Students.
- Producción se desplegará en una suscripción comercial antes del lanzamiento.

## Migración desde la implementación inicial

Se conserva como referencia el diseño funcional ya construido, pero se reemplazan las dependencias específicas:

- Supabase Auth → Microsoft Entra External ID.
- Supabase PostgreSQL → Azure Database for PostgreSQL.
- Supabase Storage → Azure Blob Storage.
- Políticas `auth.uid()` → autorización en la aplicación y controles SQL independientes del proveedor.
- Render → Azure App Service.

Supabase permanecerá temporalmente como entorno de referencia hasta que las pruebas equivalentes en Azure sean satisfactorias. No se introducirán datos reales en Supabase.

## Consecuencias

### Positivas

- Una sola plataforma tecnológica con entornos reproducibles.
- Menor riesgo de migración futura con clientes activos.
- Producción comercial separada de beneficios temporales o educativos.
- Mejor integración de identidad, secretos, almacenamiento y monitorización.
- Infraestructura auditable y reproducible.

### Costos y riesgos

- Mayor trabajo inicial.
- Azure Database for PostgreSQL puede consumir una parte importante del crédito estudiantil durante las pruebas.
- La producción requerirá una suscripción comercial y costos recurrentes antes del lanzamiento.
- Entra External ID requiere configuración de tenant y flujos de usuario fuera de Bicep.
- La seguridad no depende solo de Azure; el código y las pruebas de autorización siguen siendo esenciales.

## Bloqueos actuales

- El portal Azure Sponsorships no muestra un sponsorship activo aunque la suscripción `Azure for Students` aparece activa en Azure Portal.
- No se desplegarán recursos hasta verificar saldo, vigencia y asociación correcta de la oferta.

## Fuera de alcance en esta fase

- IA, OCR y revisión automática de documentos.
- Pagos.
- Alta disponibilidad de PostgreSQL.
- Azure Front Door, WAF y Private Endpoints.
- Carga real de documentos de usuarios.
