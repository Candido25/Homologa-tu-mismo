# ADR-004: Arquitectura activa GitHub + Vercel + Supabase sin Azure

- **Estado:** Aceptada
- **Fecha:** 2026-08-06
- **Sustituye operativamente:** ADR-002 para la arquitectura activa

## Decisión

La arquitectura activa de Homologa Tú Mismo queda definida como:

- GitHub para repositorio, ramas, pull requests y CI.
- Vercel para hosting de la aplicación Next.js.
- Supabase para autenticación administrada, PostgreSQL y almacenamiento privado.
- Monolito modular Next.js + TypeScript con fronteras portables.

Azure queda fuera de la arquitectura activa. La documentación Azure se conserva únicamente como antecedente histórico y material de trazabilidad, sin representar el camino operativo vigente.

## Decisión empresarial registrada

Homologa Tú Mismo comenzará inicialmente desde Perú. El prestador inicial previsto será el Ing. Omar Oswaldo Alcantara Aquino como persona natural con negocio.

La futura migración del fundador a España no modifica por ahora la arquitectura técnica. No se constituirá actualmente una sociedad extranjera. RUC, domicilio fiscal, régimen tributario, actividades económicas, comprobantes y demás datos no proporcionados no deben inventarse; quedan como puertas de activación comercial y no bloquean el desarrollo con identidades, expedientes, precios, pagos y datos ficticios.

## Identidad

- Marca: Homologa Tú Mismo.
- Lema: Tu título, tu trámite, nuestra guía.
- Dominio: homologatumismo.org.pe.
- Correo: contacto@homologatumismo.org.pe.

## Puertas cerradas

Permanecen cerradas tanto en interfaz como en servidor:

- documentos reales;
- OCR/IA externa;
- comunicaciones externas;
- pagos reales;
- revisión humana real;
- datos personales reales;
- PRD_2026.

El RD 889/2022 permanece como norma activa. El proyecto normativo 2026 queda desactivado.

## Consecuencias

La infraestructura Azure, Bicep, Entra y Blob Storage no deben ampliarse como arquitectura activa. Si se conservan archivos, deben tratarse como históricos. El producto técnico puede completarse con simuladores, fixtures y adaptadores fail-closed hasta que existan credenciales, datos comerciales y autorizaciones de lanzamiento.
