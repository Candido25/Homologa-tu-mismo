import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lifecyclePath = new URL("../src/modules/pilot/lifecycle.ts", import.meta.url);
const sqlPath = new URL("../database/migrations/0010_closed_pilot_lifecycle.sql", import.meta.url);

test("pilot lifecycle declares the ten approved suspension causes", async () => {
  const source = await readFile(lifecyclePath, "utf8");
  const causes = [
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

  for (const cause of causes) assert.match(source, new RegExp(`"${cause}"`));
  assert.equal((source.match(/_attempt|_request|_uploaded|_enabled|_detected|_violation|_withdrawal|_data/g) || []).length >= 10, true);
});

test("migration records closed pilot, flags, checklist, payments and tracking tables", async () => {
  const sql = await readFile(sqlPath, "utf8");
  for (const table of [
    "pilot_participants",
    "pilot_events",
    "feature_flag_registry",
    "diagnostic_runs",
    "checklist_versions",
    "document_processing_evidence",
    "presentation_guides",
    "tracking_tasks",
    "admin_action_history",
    "payment_transactions",
  ]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
  }
});
