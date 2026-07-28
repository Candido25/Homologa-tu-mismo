# Plan de transición integral a Azure

## Objetivo

Trasladar Homologa Tú Mismo a una arquitectura completamente administrada en Azure antes de incorporar usuarios o documentos reales.

## Reglas de transición

- No introducir datos reales en Supabase durante la transición.
- No eliminar Supabase hasta completar las pruebas funcionales y de seguridad en Azure.
- No crear recursos de producción sin presupuesto y alertas de costo.
- No guardar contraseñas ni secretos en el repositorio.
- Cada fase debe aprobar compilación, pruebas y revisión antes de continuar.

## Fases

### Fase 0 — Fundación y gobierno

- [x] Adoptar Azure como plataforma principal.
- [x] Documentar la arquitectura mediante ADR.
- [x] Crear estructura Bicep inicial.
- [ ] Crear presupuesto y alertas en Azure Cost Management.
- [ ] Confirmar nombres globales disponibles.
- [ ] Validar Bicep mediante GitHub Actions.

### Fase 1 — Infraestructura de desarrollo

- [ ] Crear `rg-homologa-dev` en West Europe.
- [ ] Crear App Service Linux con Node.js.
- [ ] Crear Storage Account con contenedores privados.
- [ ] Crear Key Vault con RBAC.
- [ ] Crear Application Insights y Log Analytics.
- [ ] Habilitar identidad administrada en App Service.
- [ ] Asignar permisos mínimos sobre Storage y Key Vault.

### Fase 2 — Base de datos PostgreSQL

- [ ] Elegir SKU de desarrollo después de estimar costo mensual.
- [ ] Crear Azure Database for PostgreSQL Flexible Server.
- [ ] Adaptar el esquema para eliminar dependencias de `auth.users`, `auth.uid()` y `storage.*`.
- [ ] Crear migraciones portables.
- [ ] Ejecutar pruebas de aislamiento con dos usuarios.
- [ ] Configurar copias automáticas y retención.

### Fase 3 — Identidad de clientes

- [ ] Crear tenant de Microsoft Entra External ID.
- [ ] Registrar la aplicación web.
- [ ] Configurar flujo de registro e inicio de sesión.
- [ ] Configurar confirmación de correo y recuperación de contraseña.
- [ ] Sustituir `@supabase/ssr` y Supabase Auth por MSAL/OpenID Connect.
- [ ] Mapear el identificador estable del usuario a `profiles.external_subject`.

### Fase 4 — Documentos

- [ ] Sustituir Supabase Storage por Azure Blob Storage.
- [ ] Mantener contenedores `case-documents` y `generated-reports` privados.
- [ ] Implementar rutas de blob por usuario y expediente.
- [ ] Generar acceso temporal únicamente desde el servidor.
- [ ] Aplicar límites de tamaño, tipo MIME, retención y borrado.

### Fase 5 — Despliegue continuo

- [ ] Crear identidad de despliegue con OpenID Connect.
- [ ] Configurar GitHub Environment `development`.
- [ ] Crear workflow de infraestructura con `what-if` y aprobación manual.
- [ ] Crear workflow de aplicación para Azure App Service.
- [ ] Verificar que GitHub no almacene secretos permanentes de Azure.

### Fase 6 — Validación funcional y seguridad

- [ ] Registro, confirmación, inicio y cierre de sesión.
- [ ] Redirección de `/panel` sin sesión.
- [ ] Creación y lectura de expedientes.
- [ ] Aislamiento entre dos usuarios.
- [ ] Pruebas de acceso denegado a blobs ajenos.
- [ ] Revisión de registros para descartar datos sensibles.
- [ ] Restauración de base de datos en un entorno de prueba.

### Fase 7 — Producción

- [ ] Crear `rg-homologa-prod` mediante Bicep.
- [ ] Configurar dominio y correo transaccional.
- [ ] Configurar plan de pago y continuidad al vencer Azure for Students.
- [ ] Activar alertas operativas.
- [ ] Ejecutar pruebas de aceptación.
- [ ] Retirar Render y Supabase después del periodo de verificación.

## Criterio de finalización

La transición termina únicamente cuando Azure reproduce el flujo completo, los controles de aislamiento han sido probados con dos usuarios y existe un plan documentado para continuar operando después de finalizar el beneficio estudiantil.
