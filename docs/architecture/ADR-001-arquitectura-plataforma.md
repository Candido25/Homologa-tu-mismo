# ADR-001: Arquitectura de la plataforma

- **Estado:** Aceptada
- **Fecha:** 2026-07-28
- **Proyecto:** Homologa Tú Mismo

## Contexto

Homologa Tú Mismo será una aplicación web que manejará cuentas, expedientes, documentos académicos, orientación normativa, seguimiento y análisis asistido por inteligencia artificial.

El sistema tratará datos personales y documentos de alta sensibilidad. La arquitectura debe ser mantenible por un equipo pequeño, desplegable desde GitHub, económica durante la validación del producto y capaz de crecer sin una reescritura prematura.

## Decisión

Se adopta una **arquitectura híbrida administrada y modular**, no una arquitectura 100 % serverless.

La primera etapa será un **monolito modular** con servicios administrados:

| Componente | Tecnología elegida | Responsabilidad |
|---|---|---|
| Aplicación web | Next.js + TypeScript | Interfaz pública, panel privado y API de aplicación |
| Hosting | Render Web Service, región Frankfurt | Ejecución del servidor Next.js y despliegue automático desde GitHub |
| Identidad | Supabase Auth | Registro, acceso, recuperación de cuenta y proveedores sociales |
| Base de datos | Supabase PostgreSQL, región europea | Usuarios, expedientes, requisitos, estados, revisiones y auditoría |
| Archivos | Supabase Storage, buckets privados | Documentos cargados por los usuarios |
| Autorización | PostgreSQL Row Level Security | Aislamiento de datos por usuario y expediente |
| Procesamiento pesado | Render Background Worker o Workflow, cuando sea necesario | OCR, extracción documental, análisis de IA e informes |
| Inteligencia artificial | Capa de proveedores intercambiable | Explicación, extracción estructurada y asistencia, sin depender de un único modelo |
| Integración continua | GitHub Actions | Verificación de tipos y compilación antes de desplegar |

## Principios de diseño

### 1. Reglas antes que IA

El diagnóstico jurídico-administrativo no se decidirá mediante una conversación libre con un modelo. El orden será:

1. Datos estructurados del usuario.
2. Reglas versionadas y vinculadas a fuentes oficiales.
3. Resultado determinista y nivel de confianza.
4. IA para explicar el resultado en lenguaje sencillo.
5. Revisión humana cuando el caso sea ambiguo o de alto impacto.

### 2. Archivos fuera del servidor web

Los documentos no atravesarán el servidor de Next.js como carga pesada. La aplicación generará una autorización temporal y el navegador cargará el archivo directamente a un bucket privado.

El servidor solo conservará metadatos, permisos, estado de procesamiento, hash y ruta del archivo.

### 3. Procesos largos fuera de la petición HTTP

OCR, comparación de documentos, generación de informes y llamadas extensas a modelos se ejecutarán como trabajos asíncronos. El usuario verá estados como `en cola`, `procesando`, `completado` o `requiere revisión`.

### 4. Proveedor de IA intercambiable

La lógica de negocio no llamará directamente a OpenAI, Gemini u otro proveedor. Utilizará una interfaz común para poder:

- cambiar de proveedor;
- elegir modelos según costo y sensibilidad;
- desactivar IA sin detener la plataforma;
- registrar modelo, versión, propósito y nivel de confianza;
- aplicar políticas de residencia y retención de datos.

### 5. Seguridad por defecto

- Buckets privados.
- RLS en todas las tablas expuestas.
- Claves administrativas solo en el servidor.
- Rutas de archivos separadas por usuario y expediente.
- Registros de auditoría sin contenido completo de documentos.
- Retención limitada y eliminación verificable.
- MFA obligatorio para administradores y revisores.

## Flujo principal

```text
Navegador
   |
   v
Next.js en Render (Frankfurt)
   |---------------------> Supabase Auth
   |---------------------> PostgreSQL + RLS
   |---- URL temporal ---> Supabase Storage privado
   |
   +---- crea trabajo ---> Cola / Worker futuro
                              |
                              +--> OCR
                              +--> motor de reglas
                              +--> proveedor de IA
                              +--> resultado estructurado
```

## Módulos del monolito

```text
src/
├── app/                 # páginas y endpoints
├── modules/
│   ├── auth/
│   ├── diagnostics/
│   ├── cases/
│   ├── requirements/
│   ├── documents/
│   ├── tracking/
│   ├── legal-sources/
│   ├── ai/
│   └── administration/
├── lib/                 # infraestructura compartida
└── types/
```

Los módulos podrán separarse en servicios independientes únicamente cuando exista una razón medible: carga, seguridad, equipos distintos o ritmos de despliegue diferentes.

## Decisiones sobre la propuesta externa

### Adoptado

- Next.js y TypeScript.
- PostgreSQL.
- Autenticación administrada.
- Almacenamiento privado en la nube.
- Carga directa mediante autorizaciones temporales.
- Procesos asíncronos para OCR e IA.
- Región europea.
- Módulos de triaje, documentos y seguimiento.

### Modificado

- No se describe todo el sistema como serverless. Render ejecuta un servicio web administrado y los trabajos pesados podrán escalar por separado.
- El triaje no será impulsado principalmente por IA; será gobernado por reglas verificables.
- La detección de apostilla será una observación visual, nunca una certificación de autenticidad o validez.
- El seguimiento reflejará datos ingresados por el usuario y no se presentará como estado oficial, salvo futura integración autorizada.

### Pospuesto

- Tailwind CSS: no es requisito arquitectónico. Se evaluará junto con el sistema de diseño antes de rehacer los estilos actuales.
- AWS S3 o Google Cloud Storage: Supabase Storage cubre el MVP y reduce la cantidad de proveedores.
- Microservicios: no se justifican en la fase inicial.
- Automatización completa de decisiones: requiere validación normativa, métricas y supervisión humana.

## Criterios de escalamiento

Se separará un worker cuando cualquiera de estas condiciones ocurra:

- una operación tarda más de unos segundos;
- consume memoria suficiente para afectar el servidor web;
- requiere reintentos;
- procesa archivos grandes;
- depende de una API externa inestable;
- debe conservar trazabilidad independiente.

Se considerará dividir el monolito cuando un módulo tenga necesidades de seguridad, despliegue o escalamiento claramente distintas.

## Consecuencias

### Positivas

- Menor complejidad operativa.
- Un solo repositorio y despliegue principal.
- Base relacional adecuada para expedientes y requisitos.
- Seguridad granular mediante RLS.
- Posibilidad de añadir procesamiento asíncrono sin reescribir la aplicación.
- Menor dependencia de un proveedor de IA.

### Costos y riesgos

- Render no es pago puramente por invocación; el servicio utiliza instancias.
- Supabase se convierte en una dependencia central y debe configurarse correctamente.
- RLS mal diseñada puede exponer datos, por lo que las políticas deben probarse.
- El procesamiento documental exigirá controles legales y técnicos adicionales antes de producción.
