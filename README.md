# Homologa Tú Mismo

**Tu título, tu trámite, nuestra guía.**

Aplicación web orientada a ayudar a profesionales latinoamericanos a identificar, preparar y organizar sus trámites de homologación, equivalencia o convalidación de títulos en España.

> Este proyecto es una plataforma privada e independiente. No pertenece al Gobierno de España y no garantiza la aprobación de ningún trámite.

## Estado

**Fase 1 — Autenticación y panel privado preparados**

La versión actual incluye:

- Página pública inicial.
- Diagnóstico preliminar dinámico.
- API interna para evaluar respuestas iniciales.
- Endpoint de salud para Render.
- Arquitectura híbrida administrada documentada.
- Modelo inicial de datos para usuarios, expedientes, requisitos, documentos, revisiones y trazabilidad.
- Políticas RLS y permisos por columna para Supabase.
- Registro, confirmación por correo, inicio y cierre de sesión mediante Supabase SSR.
- Protección de rutas con `proxy.ts` y nueva verificación dentro del panel.
- Panel privado inicial con consulta de expedientes del usuario.
- Controles iniciales de privacidad y seguridad documental.

La autenticación funciona cuando se configuran las variables de un proyecto Supabase. Sin credenciales, la aplicación muestra un estado seguro de configuración pendiente y no admite cuentas ni documentos.

## Arquitectura elegida

Se utilizará un **monolito modular** con servicios administrados:

- **Next.js 16 + React 19 + TypeScript:** interfaz y lógica de aplicación.
- **Render Web Service en Frankfurt:** servidor y despliegue desde GitHub.
- **Supabase Auth:** cuentas y sesiones.
- **Supabase PostgreSQL en Europa:** datos relacionales y reglas de acceso.
- **Supabase Storage privado:** documentos de usuarios.
- **Render Worker o Workflow, más adelante:** OCR, análisis de documentos e IA asíncrona.
- **Capa de IA intercambiable:** OpenAI, Gemini u otro proveedor sin acoplar la lógica del producto.

No se adopta una arquitectura de microservicios ni 100 % serverless en esta etapa. La prioridad es reducir complejidad operativa sin impedir el crecimiento.

La decisión completa está en [`docs/architecture/ADR-001-arquitectura-plataforma.md`](docs/architecture/ADR-001-arquitectura-plataforma.md).

## Principios del producto

1. Las reglas verificables determinan la ruta; la IA la explica.
2. La IA no certifica autenticidad ni garantiza aprobación.
3. Los documentos se cargan directamente a almacenamiento privado.
4. Los procesos pesados se ejecutan fuera de la petición web.
5. Cada recomendación relevante debe conservar fuente, versión y nivel de confianza.
6. La seguridad y la protección de datos se diseñan antes de recibir documentos reales.

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrir `http://localhost:3000`.

Sin variables Supabase, las páginas `/iniciar-sesion`, `/crear-cuenta` y `/panel` permanecen visibles en modo de configuración pendiente, pero no realizan operaciones de autenticación.

## Validación

```bash
npm run typecheck
npm run build
```

GitHub Actions ejecuta estas comprobaciones antes del despliegue automático.

## Despliegue en Render

El archivo `render.yaml` define un Web Service de Node.js en Frankfurt.

1. En Render, seleccionar **New > Blueprint**.
2. Elegir el repositorio `Candido25/Homologa-tu-mismo`.
3. Confirmar la configuración detectada desde `render.yaml`.
4. Introducir la URL y publishable key del proyecto Supabase cuando Render las solicite.
5. Crear o actualizar el servicio.

Render está configurado para desplegar la rama `main` solamente cuando las comprobaciones de CI hayan terminado correctamente.

> La región de un servicio de Render no puede modificarse después de crearlo. Si ya existe en otra región, será necesario crear un servicio nuevo en Frankfurt.

## Supabase

Las migraciones iniciales están en `supabase/migrations/` y la guía de activación está en [`docs/setup/supabase-auth.md`](docs/setup/supabase-auth.md).

Antes de recibir usuarios externos se debe:

- crear el proyecto en una región europea;
- aplicar las migraciones en orden;
- revisar las políticas con al menos dos usuarios de prueba;
- comprobar que ningún secreto se expone al navegador;
- configurar Site URL y URL de confirmación;
- probar registro, confirmación, acceso y cierre de sesión.

La clave `service_role` no se utiliza en esta fase.

## Próximas fases

1. Activar el proyecto Supabase europeo y ejecutar pruebas RLS.
2. Guardar el resultado del diagnóstico como expediente del usuario.
3. Sustituir el diagnóstico por un motor de reglas versionado.
4. Crear checklist personalizado por país, profesión y procedimiento.
5. Implementar carga directa a Storage privado.
6. Incorporar procesamiento asíncrono de documentos.
7. Añadir IA con proveedor intercambiable y supervisión humana.
8. Desarrollar subsanaciones, plazos y seguimiento.

## Documentación

- [Decisión de arquitectura](docs/architecture/ADR-001-arquitectura-plataforma.md)
- [Privacidad y seguridad documental](docs/security/privacy-and-document-security.md)
- [Activación de Supabase Auth](docs/setup/supabase-auth.md)
- [Esquema inicial de Supabase](supabase/migrations/0001_initial_core.sql)
- [Endurecimiento de permisos](supabase/migrations/0002_harden_client_permissions.sql)

## Propiedad

Copyright © 2026 Omar Oswaldo Alcantara Aquino. Todos los derechos reservados.
