# Matriz de preproducción y encargo Codex V1

| Area | Estado técnico | Puerta para piloto real |
|---|---|---|
| Identidad | Local ficticia y contratos portables | Supabase Auth real configurado |
| Base de datos | PostgreSQL portable con migración 0010 | Proyecto Supabase y variables seguras |
| Documentos | Ficticios, privados, hash, retención | Política privacidad, DPA y revisión |
| OCR/IA | Simulado/local | Proveedor aprobado y puerta abierta |
| Pagos | Polar simulado e idempotente | Proveedor, fiscalidad y facturación real |
| Comunicaciones | Cerradas | Dominio, consentimiento y proveedor |
| PRD_2026 | Cerrado | Decisión normativa formal futura |
| Azure | Histórico | Sin puerta activa |

## Verificaciones mínimas

Ejecutar `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, migraciones desde base vacía, reejecución de migraciones, seeds ficticios, aislamiento, controles de feature flags, escaneo de secretos y `git diff --check`.
