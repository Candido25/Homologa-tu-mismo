import assert from "node:assert/strict";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const fixtures = {
  caseA: "10000000-0000-4000-8000-000000000001",
  caseB: "10000000-0000-4000-8000-000000000002",
};

async function request(path, init) {
  const response = await fetch(new URL(path, baseUrl), init);
  const text = await response.text();
  return { response, text };
}

async function json(path, init) {
  const { response, text } = await request(path, init);
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`La respuesta de ${path} no es JSON valido: ${text.slice(0, 120)}`);
  }
  return { response, data };
}

const health = await json("/api/health");
assert.equal(health.response.status, 200);
assert.equal(health.data.status, "ok");

const diagnostic = await json("/api/diagnostico", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    country: "PE",
    degree: "Ingenieria Civil",
    objective: "work",
  }),
});
assert.equal(diagnostic.response.status, 200);
assert.equal(diagnostic.data.procedureType, "homologation");

const blockedCrossOrigin = await json("/api/expedientes", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: "https://example.invalid",
  },
  body: JSON.stringify({
    country: "PE",
    degree: "Ingenieria Civil",
    objective: "work",
  }),
});
assert.equal(blockedCrossOrigin.response.status, 403);

const panel = await request("/panel");
assert.equal(panel.response.status, 200);
assert.match(panel.text, /Usuario ficticio A/);
assert.match(panel.text, /Expediente ficticio del usuario A/);
assert.doesNotMatch(panel.text, /Expediente ficticio del usuario B/);

const ownCase = await request(`/panel/expedientes/${fixtures.caseA}`);
assert.equal(ownCase.response.status, 200);
assert.match(ownCase.text, /Ingeniería de prueba|Ingenier/);

const foreignCase = await request(`/panel/expedientes/${fixtures.caseB}`);
assert.equal(foreignCase.response.status, 404);

console.log("Flujo web local validado: salud, diagnostico, origen, panel e aislamiento por ruta.");
