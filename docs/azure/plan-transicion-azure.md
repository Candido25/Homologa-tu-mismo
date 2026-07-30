# Plan de transición integral a Azure

## Objetivo

Trasladar Homologa Tú Mismo a una arquitectura completamente administrada en Azure, aprovechando Azure for Students y GitHub Education como plataforma inicial de construcción, validación y demostración del emprendimiento.

## Reglas de transición

- No introducir datos reales en Supabase durante la transición.
- No eliminar Supabase hasta completar las pruebas funcionales y de seguridad en Azure.
- Verificar crédito, vigencia y alertas antes de crear recursos que consuman saldo.
- Azure for Students será el entorno inicial del proyecto mientras el uso sea educativo, de desarrollo, validación o demostración.
- No incorporar pagos ni documentos reales sensibles hasta aprobar seguridad, continuidad, respaldo y costos.
- La suscripción de pago se activará cuando el producto tenga tracción real, requiera continuidad comercial o supere los límites del crédito estudiantil.
- No crear recursos de producción sin presupuesto y alertas de costo.
- No guardar contraseñas ni secretos en el repositorio.
- Cada fase debe aprobar compilación, pruebas y revisión antes de continuar.

## Fases

### Fase 0 — Fundación y gobierno

- [x] Adoptar Azure como plataforma principal.
- [x] Documentar la arquitectura mediante ADR.
- [x] Crear estructura Bicep inicial.
- [x] Crear presupuesto y alertas en Azure Cost Management.
- [x] Validar Bicep mediante GitHub Actions.
- [ ] Confirmar el saldo y la fecha de renovación de Azure for Students.
- [ ] Resolver la discrepancia: suscripción activa en Azure Portal, sin sponsorship activo en Azure Sponsorships.
- [x] Validar los nombres previstos mediante `what-if` en la suscripción de destino.
- [x] Documentar el criterio económico y operativo para pasar de Azure for Students a pago por uso.

### Fase 1 — Infraestructura de desarrollo

- [x] Ejecutar `what-if` antes de crear recursos.
- [x] Crear `rg-homologa-dev` en Chile Central dentro de Azure for Students.
- [x] Crear App Service Linux con Node.js.
- [x] Crear Storage Account con contenedores privados.
- [x] Crear Key Vault con RBAC.
- [x] Crear Application Insights y Log Analytics.
- [x] Habilitar identidad administrada en App Service.
- [x] Asignar permisos mínimos sobre Storage y Key Vault.
- [x] Confirmar que el entorno contiene únicamente datos ficticios hasta aprobar datos reales.

### Fase 2 — Base de datos PostgreSQL

- [x] Elegir SKU inicial mínimo de desarrollo: `B_Standard_B1ms`, 32 GiB, Burstable.
- [x] Validar mediante `what-if` el escenario opcional con PostgreSQL mínimo.
- [x] Preparar workflow OIDC con firewall temporal para aplicar migraciones.
- [x] Crear identidad OIDC y environment protegido `development-database`.
- [x] Validar localmente `0001_portable_core` y `0002_auth_sessions`.
- [ ] Crear Azure Database for PostgreSQL Flexible Server de desarrollo mediante Bicep opcional.
- [x] Adaptar el esquema para eliminar dependencias de `auth.users`, `auth.uid()` y `storage.*`.
- [x] Crear migraciones portables.
- [x] Ejecutar pruebas locales de aislamiento con dos usuarios ficticios.
- [ ] Repetir las pruebas de aislamiento con dos identidades Entra ficticias en Azure.
- [ ] Configurar copias automáticas y retención.

### Fase 3 — Identidad de clientes

- [x] Implementar MSAL/OpenID Connect con PKCE, `state`, `nonce` y sesión opaca propia.
- [x] Preparar el mapeo estable `issuer` + `subject` hacia `external_identities`.
- [x] Preparar cierre de sesión local y de Entra.
- [x] Crear tenant de Microsoft Entra External ID.
- [x] Registrar la aplicación web.
- [x] Configurar flujo de registro e inicio de sesión.
- [x] Configurar confirmación de correo y recuperación de contraseña.
- [ ] Aplicar y validar la identidad visual preparada en el inicio de sesión administrado por Entra.
- [ ] Activar Entra en Azure y retirar Supabase Auth después de la validación.

### Fase 4 — Documentos

- [x] Implementar adaptador Azure Blob Storage con identidad administrada.
- [ ] Sustituir Supabase Storage por Azure Blob Storage en el flujo de usuario.
- [x] Validar contenedores privados con Azurite en desarrollo y CI.
- [x] Implementar rutas de blob por usuario y expediente.
- [x] Entregar descargas desde el servidor sin exponer URL pública.
- [x] Aplicar límites de tamaño, tipo MIME, hash y borrado en el adaptador.
- [x] Implementar gestor documental controlado para el entorno local ficticio.
- [x] Aplicar política portable de vencimiento, eliminación y auditoría documental.
- [x] Probar únicamente con archivos ficticios durante desarrollo.

### Fase 5 — Despliegue continuo de desarrollo

- [x] Crear identidad de despliegue con OpenID Connect.
- [x] Configurar GitHub Environment `development` para simulaciones.
- [x] Documentar configuración OIDC de GitHub Actions para Azure Students.
- [x] Crear workflow manual de infraestructura con `what-if`.
- [x] Configurar `development-deployment` con rama `main` y aprobación manual.
- [x] Preparar workflow manual OIDC para Azure App Service con artefacto verificable y health check.
- [x] Ejecutar el primer despliegue aprobado de la aplicación.
- [x] Preparar workflow diario de retención con OIDC, Key Vault y resumen operativo.
- [x] Preparar prueba manual de recuperación de un blob ficticio.
- [x] Configurar `development-operations` restringido a la rama `main`.
- [ ] Ejecutar y supervisar la retención en el entorno Azure desplegado.
- [x] Ejecutar y supervisar la recuperación de un blob ficticio en Azure.
- [x] Preparar alertas opt-in por fallo o ausencia de ejecución de retención.
- [ ] Activar y probar las alertas después de la primera ejecución correcta.
- [x] Verificar que GitHub no almacene secretos permanentes de Azure.

### Fase 6 — Validación funcional y seguridad

- [ ] Registro, confirmación, inicio y cierre de sesión.
- [ ] Redirección de `/panel` sin sesión.
- [x] Creación y lectura de expedientes ficticios.
- [x] Aislamiento entre dos usuarios ficticios.
- [x] Pruebas de acceso denegado a blobs ajenos.
- [ ] Revisión de registros para descartar datos sensibles.
- [x] Ejecutar la prueba de recuperación documental en Azure con datos ficticios.
- [ ] Restauración de base de datos en un entorno de prueba.

### Fase 7 — Producción comercial

- [ ] Crear o seleccionar una suscripción Azure de pago por uso o empresarial.
- [ ] Crear presupuesto y alertas propios de producción.
- [ ] Crear `rg-homologa-prod` mediante Bicep en la suscripción comercial.
- [ ] Configurar dominio y correo transaccional.
- [ ] Configurar servicios productivos y continuidad operativa.
- [ ] Activar alertas operativas.
- [ ] Ejecutar pruebas de aceptación.
- [ ] Autorizar incorporación de clientes y documentos reales únicamente después de aprobar seguridad y costos.
- [ ] Retirar Render y Supabase después del periodo de verificación.

## Criterio de finalización

La transición termina únicamente cuando Azure reproduce el flujo completo, los controles de aislamiento han sido probados con dos usuarios, producción está desplegada en una suscripción comercial independiente y existe un plan documentado de continuidad y costos recurrentes.
