# Homologa Tú Mismo

**Tu título, tu trámite, nuestra guía.**

Aplicación web orientada a ayudar a profesionales latinoamericanos a identificar, preparar y organizar sus trámites de homologación, equivalencia o convalidación de títulos en España.

> Este proyecto es una plataforma privada e independiente. No pertenece al Gobierno de España y no garantiza la aprobación de ningún trámite.

## Estado

**Fase 0 — Base técnica, arquitectura y validación del concepto**

La versión actual incluye:

- Página pública inicial.
- Diagnóstico preliminar dinámico.
- API interna para evaluar respuestas iniciales.
- Endpoint de salud para Render.
- Arquitectura híbrida administrada documentada.
- Modelo inicial de datos para usuarios, expedientes, requisitos, documentos, revisiones y trazabilidad.
- Políticas RLS y permisos por columna para Supabase.
- Controles iniciales de privacidad y seguridad documental.

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
4. Crear el servicio.

Render está configurado para desplegar la rama `main` solamente cuando las comprobaciones de CI hayan terminado correctamente.

> La región de un servicio de Render no puede modificarse después de crearlo. Si ya existe en otra región, será necesario crear un servicio nuevo en Frankfurt.

## Supabase

Las migraciones iniciales están en `supabase/migrations/`.

Todavía no deben aplicarse a producción sin:

- crear el proyecto en una región europea;
- revisar las políticas con al menos dos usuarios de prueba;
- comprobar que ningún secreto se expone al navegador;
- definir retención, eliminación y respuesta a incidentes;
- completar la evaluación jurídica antes de procesar documentos reales.

## Próximas fases

1. Crear el proyecto Supabase en Europa.
2. Integrar Supabase Auth en Next.js.
3. Crear registro, inicio de sesión y panel privado.
4. Sustituir el diagnóstico por un motor de reglas versionado.
5. Crear expediente y checklist personalizado.
6. Implementar carga directa a Storage privado.
7. Incorporar procesamiento asíncrono de documentos.
8. Añadir IA con proveedor intercambiable y supervisión humana.
9. Desarrollar subsanaciones, plazos y seguimiento.

## Documentación

- [Decisión de arquitectura](docs/architecture/ADR-001-arquitectura-plataforma.md)
- [Privacidad y seguridad documental](docs/security/privacy-and-document-security.md)
- [Esquema inicial de Supabase](supabase/migrations/0001_initial_core.sql)
- [Endurecimiento de permisos](supabase/migrations/0002_harden_client_permissions.sql)

## Propiedad

Copyright © 2026 Omar Oswaldo Alcantara Aquino. Todos los derechos reservados.
