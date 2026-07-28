# Homologa Tú Mismo

**Tu título, tu trámite, nuestra guía.**

Aplicación web orientada a ayudar a profesionales latinoamericanos a identificar, preparar y organizar sus trámites de homologación, equivalencia o convalidación de títulos en España.

> Este proyecto es una plataforma privada e independiente. No pertenece al Gobierno de España y no garantiza la aprobación de ningún trámite.

## Estado

**Fase 0 — Base técnica y validación del concepto**

La primera versión incluye:

- Landing page del producto.
- Diagnóstico preliminar dinámico.
- API interna para evaluar respuestas iniciales.
- Endpoint de salud para Render.
- Arquitectura preparada para incorporar usuarios, expedientes, PostgreSQL e inteligencia artificial.

## Tecnología

- Next.js 16 con App Router.
- React 19.
- TypeScript.
- Render como Web Service.
- PostgreSQL en una fase posterior.

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Validación

```bash
npm run typecheck
npm run build
```

## Despliegue en Render

El archivo `render.yaml` define un Web Service de Node.js.

1. En Render, seleccionar **New > Blueprint**.
2. Elegir el repositorio `Candido25/Homologa-tu-mismo`.
3. Confirmar la configuración detectada desde `render.yaml`.
4. Crear el servicio.

Cada actualización de la rama `main` podrá activar un nuevo despliegue automático.

## Próximas fases

1. Diseño definitivo de identidad visual y experiencia de usuario.
2. Modelo de datos para usuarios y expedientes.
3. Autenticación y panel privado.
4. Checklist por país, profesión y trámite.
5. Carga segura de documentos.
6. Revisión documental asistida por IA.
7. Módulo de subsanaciones y seguimiento.

## Propiedad

Copyright © 2026 Omar Oswaldo Alcantara Aquino. Todos los derechos reservados.
