# Activación de Supabase Auth

Este documento describe cómo activar el módulo de cuentas de **Homologa Tú Mismo** sin habilitar todavía la carga de documentos sensibles.

## 1. Crear el proyecto

1. Crear un proyecto nuevo en Supabase.
2. Elegir una región de la Unión Europea, preferentemente **Central EU (Frankfurt)**.
3. Utilizar una contraseña de base de datos única y guardarla en un gestor de contraseñas.
4. No reutilizar claves de otros proyectos.

## 2. Aplicar el modelo de datos

Ejecutar en orden:

1. `supabase/migrations/0001_initial_core.sql`
2. `supabase/migrations/0002_harden_client_permissions.sql`

Estas migraciones crean las tablas iniciales, activan Row Level Security, configuran buckets privados y restringen las columnas que el cliente puede modificar.

Antes de usar datos reales se deben probar las políticas con, al menos, dos cuentas distintas.

## 3. Configurar autenticación

En Supabase Auth:

1. Mantener habilitado correo y contraseña.
2. Exigir confirmación de correo para el entorno productivo.
3. Configurar la URL pública de Render como `Site URL`.
4. Añadir como URL permitida de redirección:
   - `https://DOMINIO-DEL-SERVICIO/auth/confirm`
   - `http://localhost:3000/auth/confirm` únicamente para desarrollo local.
5. Personalizar posteriormente los correos de confirmación con la identidad visual del proyecto.

Google y Microsoft no se habilitarán hasta tener dominio definitivo, política de privacidad y pantallas de consentimiento configuradas.

## 4. Obtener variables públicas

Desde la sección **Connect** del proyecto Supabase, obtener:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Publishable key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

La publishable key puede estar en el navegador porque su capacidad está limitada por las políticas RLS. No obstante, nunca debe sustituir los controles de autorización.

La clave `service_role` no es necesaria para esta fase y no debe configurarse todavía en Render.

## 5. Configurar Render

El Blueprint solicitará las siguientes variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

No guardar estos valores directamente en GitHub. Render debe disponer de ellos durante el proceso de compilación porque Next.js incorpora las variables `NEXT_PUBLIC_*` en el cliente.

## 6. Comprobaciones mínimas

Antes de habilitar usuarios externos:

- [ ] Crear una cuenta y confirmar el correo.
- [ ] Iniciar y cerrar sesión.
- [ ] Verificar que `/panel` redirige al usuario no autenticado.
- [ ] Crear dos usuarios de prueba.
- [ ] Confirmar que cada usuario solo puede leer sus propios expedientes.
- [ ] Intentar modificar columnas de estado desde el cliente y verificar que PostgreSQL lo rechaza.
- [ ] Confirmar que los buckets documentales no son públicos.
- [ ] Revisar que ningún registro técnico contenga tokens o datos personales.

## 7. Funciones expresamente desactivadas

Hasta completar pruebas de seguridad, privacidad y eliminación:

- carga de pasaportes;
- carga de títulos y certificados;
- OCR;
- envío de documentos a proveedores de IA;
- acceso de revisores humanos;
- operaciones con clave administrativa;
- seguimiento presentado como oficial.

## 8. Criterio para pasar a la siguiente fase

La fase se considerará aprobada cuando la autenticación funcione en Render, las pruebas RLS entre dos usuarios sean satisfactorias y se haya comprobado que la aplicación funciona sin ninguna clave administrativa expuesta.
