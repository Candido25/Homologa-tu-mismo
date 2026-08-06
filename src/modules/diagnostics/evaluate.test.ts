import { describe, it, expect } from "vitest";
import { parseDiagnosticInput } from "./evaluate";

describe("parseDiagnosticInput", () => {
  it("should return ok: true for valid input using country code", () => {
    const input = {
      country: "pe", // case insensitive
      degree: "Ingeniería de Sistemas",
      objective: "work",
    };

    const result = parseDiagnosticInput(input);

    expect(result).toEqual({
      ok: true,
      input: {
        country: "PE",
        countryName: "Perú",
        degree: "Ingeniería de Sistemas",
        objective: "work",
      },
    });
  });

  it("should return ok: true for valid input using country name", () => {
    const input = {
      country: " MÉXICO ", // with spaces and uppercase
      degree: "Médico Cirujano",
      objective: "study",
    };

    const result = parseDiagnosticInput(input);

    expect(result).toEqual({
      ok: true,
      input: {
        country: "MX",
        countryName: "México",
        degree: "Médico Cirujano",
        objective: "study",
      },
    });
  });

  it("should correctly format and trim the degree", () => {
    const input = {
      country: "CL",
      degree: "   Arquitectura    y  Urbanismo   ", // extra spaces
      objective: "academic",
    };

    const result = parseDiagnosticInput(input);

    expect(result).toEqual({
      ok: true,
      input: {
        country: "CL",
        countryName: "Chile",
        degree: "Arquitectura y Urbanismo",
        objective: "academic",
      },
    });
  });

  it("should handle the 'unknown' objective", () => {
    const input = {
      country: "OTHER",
      degree: "Docente",
      objective: "unknown",
    };

    const result = parseDiagnosticInput(input);

    expect(result).toEqual({
      ok: true,
      input: {
        country: "OTHER",
        countryName: "Otro país",
        degree: "Docente",
        objective: "unknown",
      },
    });
  });

  describe("invalid payload structures", () => {
    it.each([null, undefined, "string", 123, true, []])("should reject non-object body: %s", (body) => {
      const result = parseDiagnosticInput(body);
      expect(result).toEqual({
        ok: false,
        error: "La solicitud enviada no es válida.",
      });
    });
  });

  describe("invalid field values", () => {
    it("should reject invalid country", () => {
      const input = {
        country: "USA", // Not in COUNTRY_OPTIONS
        degree: "Computer Science",
        objective: "work",
      };

      const result = parseDiagnosticInput(input);

      expect(result).toEqual({
        ok: false,
        error: "Completa correctamente el país, el título y el objetivo principal.",
      });
    });

    it("should reject empty country", () => {
      const input = {
        country: "",
        degree: "Computer Science",
        objective: "work",
      };

      const result = parseDiagnosticInput(input);

      expect(result).toEqual({
        ok: false,
        error: "Completa correctamente el país, el título y el objetivo principal.",
      });
    });

    it("should reject short degree", () => {
      const input = {
        country: "CO",
        degree: "ab", // Length < 3
        objective: "work",
      };

      const result = parseDiagnosticInput(input);

      expect(result).toEqual({
        ok: false,
        error: "Completa correctamente el país, el título y el objetivo principal.",
      });
    });

    it("should reject overly long degree", () => {
      const input = {
        country: "AR",
        degree: "a".repeat(181), // Length > 180
        objective: "work",
      };

      const result = parseDiagnosticInput(input);

      expect(result).toEqual({
        ok: false,
        error: "Completa correctamente el país, el título y el objetivo principal.",
      });
    });

    it("should reject empty degree", () => {
      const input = {
        country: "BO",
        degree: "",
        objective: "work",
      };

      const result = parseDiagnosticInput(input);

      expect(result).toEqual({
        ok: false,
        error: "Completa correctamente el país, el título y el objetivo principal.",
      });
    });

    it("should reject missing degree", () => {
      const input = {
        country: "EC",
        objective: "work",
      };

      const result = parseDiagnosticInput(input);

      expect(result).toEqual({
        ok: false,
        error: "Completa correctamente el país, el título y el objetivo principal.",
      });
    });

    it("should reject invalid objective", () => {
      const input = {
        country: "VE",
        degree: "Ingeniería",
        objective: "vacation", // Not in DiagnosticObjective
      };

      const result = parseDiagnosticInput(input);

      expect(result).toEqual({
        ok: false,
        error: "Completa correctamente el país, el título y el objetivo principal.",
      });
    });

    it("should reject empty objective", () => {
      const input = {
        country: "VE",
        degree: "Ingeniería",
        objective: "",
      };

      const result = parseDiagnosticInput(input);

      expect(result).toEqual({
        ok: false,
        error: "Completa correctamente el país, el título y el objetivo principal.",
      });
    });
  });
});
