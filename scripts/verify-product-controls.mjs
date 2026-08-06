import process from "node:process";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL es obligatorio para verificar controles.");

const expectedSuspensionCauses = [
  "participant_withdrawal",
  "deletion_request",
  "suspected_real_personal_data",
  "real_document_uploaded",
  "external_provider_enabled",
  "payment_attempt_real",
  "legal_contradiction_detected",
  "admin_privilege_violation",
  "cross_user_access_attempt",
  "prd_2026_activation_attempt",
];

const expectedClosedFlags = [
  "REAL_DOCUMENTS",
  "EXTERNAL_OCR_AI",
  "EXTERNAL_COMMUNICATIONS",
  "REAL_PAYMENTS",
  "REAL_HUMAN_REVIEW",
  "REAL_PERSONAL_DATA",
  "PRD_2026",
];

const client = new pg.Client({
  connectionString: databaseUrl,
  application_name: "homologa-product-controls",
  connectionTimeoutMillis: 15_000,
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await client.connect();

  const migrations = await client.query("select version from public.schema_migrations order by version");
  assert(
    migrations.rows.some((row) => row.version === "0010_closed_pilot_lifecycle"),
    "migration 0010 no esta registrada",
  );

  const flags = await client.query(
    "select code, enabled, locked_closed from public.feature_flag_registry order by code",
  );
  for (const code of expectedClosedFlags) {
    const row = flags.rows.find((item) => item.code === code);
    assert(row, `falta feature flag ${code}`);
    assert(row.enabled === false && row.locked_closed === true, `feature flag ${code} no esta cerrada`);
  }

  const causeCheck = await client.query(
    `
    select conname, pg_get_constraintdef(oid) as definition
    from pg_constraint
    where conrelid = 'public.pilot_participants'::regclass
    `,
  );
  const causeDefinition = causeCheck.rows.map((row) => row.definition).join("\n");
  for (const cause of expectedSuspensionCauses) {
    assert(causeDefinition.includes(cause), `falta causa de suspension ${cause}`);
  }

  const isolation = await client.query(
    `
    select
      (select count(*) from public.cases where user_id = '00000000-0000-4000-8000-000000000001') as user_a_cases,
      (select count(*) from public.cases where user_id = '00000000-0000-4000-8000-000000000002') as user_b_cases,
      (select count(*) from public.cases where id = '10000000-0000-4000-8000-000000000002' and user_id = '00000000-0000-4000-8000-000000000001') as forbidden_cross_read
    `,
  );
  const row = isolation.rows[0];
  assert(Number(row.user_a_cases) >= 1, "usuario ficticio A sin expediente");
  assert(Number(row.user_b_cases) >= 1, "usuario ficticio B sin expediente");
  assert(Number(row.forbidden_cross_read) === 0, "consulta directa de aislamiento devuelve expediente ajeno");

  const payments = await client.query(
    "select count(*)::int as count from public.payment_transactions where provider = 'polar-simulator' and status like 'simulated_%'",
  );
  assert(payments.rows[0].count >= 1, "no hay pago ficticio simulado");

  console.log("product_controls_ok");
} finally {
  await client.end();
}
