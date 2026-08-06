import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const flagsPath = new URL("../src/modules/feature-flags/server.ts", import.meta.url);
const diagnosticsPath = new URL("../src/modules/diagnostics/evaluate.ts", import.meta.url);

test("restricted feature flags stay explicitly fail-closed on the server", async () => {
  const source = await readFile(flagsPath, "utf8");
  for (const flag of [
    "REAL_DOCUMENTS",
    "EXTERNAL_OCR_AI",
    "EXTERNAL_COMMUNICATIONS",
    "REAL_PAYMENTS",
    "REAL_HUMAN_REVIEW",
    "REAL_PERSONAL_DATA",
    "PRD_2026",
  ]) {
    assert.match(source, new RegExp(`"${flag}"`));
  }
  assert.match(source, /throw new Error/);
});

test("diagnostic module does not classify legal route by title keywords", async () => {
  const source = await readFile(diagnosticsPath, "utf8");
  assert.doesNotMatch(source, /regulatedTerms/);
  assert.doesNotMatch(source, /includes\(term\)/);
  assert.match(source, /requiresHumanReview/);
});
