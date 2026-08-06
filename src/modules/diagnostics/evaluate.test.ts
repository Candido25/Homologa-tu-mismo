import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateDiagnostic, DiagnosticInput, DIAGNOSTIC_VERSION } from "./evaluate";

describe("evaluateDiagnostic", () => {
  it("should return validation route when objective is study", () => {
    const input: DiagnosticInput = {
      country: "PE",
      countryName: "Perú",
      degree: "Ingeniería de Sistemas",
      objective: "study",
    };

    const result = evaluateDiagnostic(input);

    assert.equal(result.route, "Convalidación de estudios");
    assert.equal(result.procedureType, "validation");
    assert.equal(result.confidence, "media");
    assert.equal(result.version, DIAGNOSTIC_VERSION);
    assert.match(result.explanation, /Si estudiaste/);
  });

  it("should return equivalence route when objective is academic", () => {
    const input: DiagnosticInput = {
      country: "CO",
      countryName: "Colombia",
      degree: "Diseño Gráfico",
      objective: "academic",
    };

    const result = evaluateDiagnostic(input);

    assert.equal(result.route, "Equivalencia académica probable");
    assert.equal(result.procedureType, "equivalence");
    assert.equal(result.confidence, "media");
    assert.equal(result.version, DIAGNOSTIC_VERSION);
    assert.match(result.explanation, /Tu objetivo parece ser acreditar/);
  });

  it("should return homologation route when objective is work and degree is regulated", () => {
    const input: DiagnosticInput = {
      country: "MX",
      countryName: "México",
      degree: "Licenciatura en Medicina",
      objective: "work",
    };

    const result = evaluateDiagnostic(input);

    assert.equal(result.route, "Homologación probable");
    assert.equal(result.procedureType, "homologation");
    assert.equal(result.confidence, "media-alta");
    assert.equal(result.version, DIAGNOSTIC_VERSION);
    assert.match(result.explanation, /puede estar relacionado con una profesión regulada/);
  });

  it("should detect regulated degrees regardless of casing and exact match", () => {
    const input: DiagnosticInput = {
      country: "AR",
      countryName: "Argentina",
      degree: "INGENIERÍA CIVIL",
      objective: "work",
    };

    const result = evaluateDiagnostic(input);

    assert.equal(result.route, "Homologación probable");
    assert.equal(result.procedureType, "homologation");
    assert.equal(result.confidence, "media-alta");
  });

  it("should return undetermined route when objective is work and degree is not regulated", () => {
    const input: DiagnosticInput = {
      country: "CL",
      countryName: "Chile",
      degree: "Periodismo",
      objective: "work",
    };

    const result = evaluateDiagnostic(input);

    assert.equal(result.route, "Revisión entre homologación y equivalencia");
    assert.equal(result.procedureType, "undetermined");
    assert.equal(result.confidence, "inicial");
    assert.equal(result.version, DIAGNOSTIC_VERSION);
    assert.match(result.explanation, /todavía necesitamos conocer la profesión española/);
  });

  it("should return undetermined route when objective is unknown", () => {
    const input: DiagnosticInput = {
      country: "EC",
      countryName: "Ecuador",
      degree: "Cualquier Título",
      objective: "unknown",
    };

    const result = evaluateDiagnostic(input);

    assert.equal(result.route, "Revisión entre homologación y equivalencia");
    assert.equal(result.procedureType, "undetermined");
    assert.equal(result.confidence, "inicial");
    assert.equal(result.version, DIAGNOSTIC_VERSION);
  });
});
