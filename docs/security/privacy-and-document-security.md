# Privacidad y seguridad documental

## Alcance

Homologa Tú Mismo podrá tratar pasaportes, documentos de identidad, títulos, certificados académicos, apostillas, resoluciones y comunicaciones administrativas. Estos archivos no deben tratarse como simples adjuntos.

Este documento define requisitos técnicos iniciales. No sustituye el análisis jurídico, la política de privacidad, los contratos con proveedores ni una evaluación de impacto en protección de datos.

## Clasificación de información

| Nivel | Ejemplos | Regla mínima |
|---|---|---|
| Pública | guías, enlaces y requisitos generales | puede publicarse |
| Interna | reglas, métricas y configuración no secreta | acceso de equipo |
| Personal | nombre, correo, país, profesión | acceso por necesidad |
| Alta sensibilidad operativa | pasaporte, firma, número de expediente, documentos académicos | cifrado, acceso restringido y retención limitada |
| Secreta | claves API, service role, tokens, credenciales | nunca en cliente, repositorio ni registros |

## Reglas obligatorias

### Minimización

- Solicitar únicamente los campos y documentos necesarios para una función concreta.
- Evitar almacenar copias de identidad durante el diagnóstico gratuito.
- Permitir ocultar o redactar datos no necesarios antes del análisis con IA.
- No conservar el texto completo extraído cuando baste con campos estructurados.

### Residencia y proveedores

- Crear Render en Frankfurt.
- Crear Supabase en una región de la Unión Europea.
- Revisar contrato, DPA, subencargados, ubicación de procesamiento y mecanismos de transferencia de cada proveedor.
- No asumir que elegir una región europea resuelve por sí sola el cumplimiento del RGPD.

### Almacenamiento

- Utilizar exclusivamente buckets privados para expedientes.
- Separar cada archivo mediante la ruta `usuario/expediente/documento/archivo`.
- Entregar acceso mediante sesión autenticada o URL temporal.
- Limitar tamaño y tipos MIME permitidos.
- Calcular hash del archivo para trazabilidad y detección de duplicados.
- Desactivar sobrescritura; cada nueva versión debe crear un objeto distinto.

### Autorización

- Activar Row Level Security en todas las tablas expuestas.
- El usuario solo puede consultar sus expedientes y documentos.
- Revisores solo acceden a casos asignados y durante el periodo necesario.
- Administradores y revisores deben usar MFA.
- La clave `service_role` jamás se enviará al navegador.

### Inteligencia artificial

- No enviar documentos completos a un modelo por defecto.
- Extraer o redactar localmente los datos innecesarios antes de llamar al proveedor.
- Registrar proveedor, modelo, finalidad, fecha y política de retención aplicable.
- Desactivar el uso de datos para entrenamiento cuando el proveedor lo permita.
- Utilizar residencia europea o controles equivalentes cuando estén disponibles y sean contractualmente aplicables.
- Prohibir que la IA certifique autenticidad, validez legal, aprobación futura o identidad del titular.
- Exigir revisión humana para resultados de baja confianza, contradicciones o decisiones con efecto relevante.

### Registros

Los registros técnicos no deben contener:

- contenido completo de documentos;
- números de pasaporte;
- direcciones completas;
- claves o tokens;
- prompts con datos personales sin depuración.

Los registros de auditoría deben incluir únicamente lo necesario: actor, acción, entidad, fecha, resultado y metadatos no sensibles.

### Retención y eliminación

Antes del lanzamiento se definirán plazos por tipo de dato. Como principio:

- diagnóstico anónimo: no persistir;
- cuenta sin expediente: conservar mientras esté activa;
- documentos: eliminar al terminar el servicio o al vencer el plazo informado;
- archivos sustituidos: aplicar eliminación programada;
- copias de seguridad: documentar el tiempo máximo hasta desaparición definitiva;
- auditoría: conservar según necesidad de seguridad y defensa jurídica.

El usuario deberá poder solicitar la eliminación de su cuenta y expediente. El sistema registrará la ejecución de la eliminación sin conservar el contenido eliminado.

La implementación portable asigna vencimiento al cargar, elimina blobs vencidos mediante un proceso interno autenticado y registra únicamente identificadores técnicos y la fuente `retention`. Este comportamiento se prueba con archivos ficticios en local y CI; la programación y supervisión del proceso debe configurarse por separado en cada entorno administrado.

## Evaluación de impacto

Antes de habilitar análisis documental para usuarios reales se debe realizar una evaluación de impacto en protección de datos que cubra, como mínimo:

- tipos de documentos;
- finalidades;
- base jurídica;
- proveedores y transferencias;
- decisiones automatizadas;
- riesgos de acceso indebido;
- errores de extracción o clasificación;
- suplantación de identidad;
- plazos de retención;
- respuesta a incidentes;
- ejercicio de derechos.

## Controles previos al lanzamiento

- [ ] Repositorio privado o sin secretos ni información de usuarios.
- [ ] Supabase creado en región europea.
- [ ] RLS probada con al menos dos usuarios distintos.
- [ ] Bucket privado y políticas probadas.
- [ ] Variables secretas configuradas en Render.
- [ ] MFA para administradores.
- [ ] Política de privacidad y términos publicados.
- [ ] Contratos/DPA revisados.
- [ ] Plan de respuesta a incidentes.
- [x] Eliminación y retención probadas con archivos ficticios en local y CI.
- [ ] IA desactivable mediante configuración.
- [ ] Evaluación de impacto completada antes de análisis documental real.
