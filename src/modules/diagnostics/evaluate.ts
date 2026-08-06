export const DIAGNOSTIC_VERSION = "prototype-2026-07-28";

export const COUNTRY_OPTIONS = [
  { code: "PE", name: "Perú" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "EC", name: "Ecuador" },
  { code: "AR", name: "Argentina" },
  { code: "BO", name: "Bolivia" },
  { code: "VE", name: "Venezuela" },
  { code: "MX", name: "México" },
  { code: "OTHER", name: "Otro país" },
] as const;

export type DiagnosticObjective = "work" | "study" | "academic" | "unknown";
export type ProcedureType = "homologation" | "equivalence" | "validation" | "undetermined";

export type DiagnosticInput = {
  country: string;
  countryName: string;
  degree: string;
  objective: DiagnosticObjective;
};

export type DiagnosticResult = {
  route: string;
  procedureType: ProcedureType;
  confidence: string;
  explanation: string;
  nextSteps: string[];
  version: string;
  sourceBasis: string;
  requiresHumanReview: boolean;
};

const objectiveValues = new Set<DiagnosticObjective>(["work", "study", "academic", "unknown"]);

function resolveCountry(value: string) {
  const normalized = value.trim();
  const byCode = COUNTRY_OPTIONS.find((country) => country.code === normalized.toUpperCase());
  const byName = COUNTRY_OPTIONS.find(
    (country) => country.name.toLocaleLowerCase("es") === normalized.toLocaleLowerCase("es"),
  );
  return byCode ?? byName;
}

export function parseDiagnosticInput(body: unknown):
  | { ok: true; input: DiagnosticInput }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "La solicitud enviada no es válida." };
  }

  const values = body as Record<string, unknown>;
  const countryValue = typeof values.country === "string" ? values.country.trim() : "";
  const degree = typeof values.degree === "string" ? values.degree.trim().replace(/\s+/g, " ") : "";
  const objectiveValue = typeof values.objective === "string" ? values.objective : "";
  const country = resolveCountry(countryValue);

  if (!country || degree.length < 3 || degree.length > 180 || !objectiveValues.has(objectiveValue as DiagnosticObjective)) {
    return { ok: false, error: "Completa correctamente el país, el título y el objetivo principal." };
  }

  return {
    ok: true,
    input: {
      country: country.code,
      countryName: country.name,
      degree,
      objective: objectiveValue as DiagnosticObjective,
    },
  };
}

export function evaluateDiagnostic(input: DiagnosticInput): DiagnosticResult {
  if (input.objective === "study") {
    return {
      route: "Convalidación de estudios",
      procedureType: "validation",
      confidence: "media",
      explanation: `Si estudiaste ${input.degree} en ${input.countryName} y quieres continuar estudios en España, normalmente la universidad española analiza qué asignaturas o créditos puede reconocerte.`,
      nextSteps: [
        "Elegir la universidad y el programa español de destino.",
        "Solicitar certificado académico y contenidos de las asignaturas.",
        "Revisar los requisitos particulares de la universidad receptora.",
      ],
      version: DIAGNOSTIC_VERSION,
      sourceBasis: "RD 889/2022 activo y reglas internas versionadas; sin proyecto normativo 2026.",
      requiresHumanReview: true,
    };
  }

  if (input.objective === "academic") {
    return {
      route: "Equivalencia académica probable",
      procedureType: "equivalence",
      confidence: "media",
      explanation: `Tu objetivo parece ser acreditar en España el nivel académico de ${input.degree}, sin vincularlo todavía al ejercicio de una profesión regulada.`,
      nextSteps: [
        "Confirmar si la profesión que deseas ejercer está regulada en España.",
        "Reunir título, certificado académico y documentación legalizada.",
        "Comparar tu objetivo con los efectos jurídicos de la equivalencia.",
      ],
      version: DIAGNOSTIC_VERSION,
      sourceBasis: "RD 889/2022 activo y reglas internas versionadas; sin proyecto normativo 2026.",
      requiresHumanReview: true,
    };
  }

  if (input.objective === "work") {
    return {
      route: "Revisión profesional requerida",
      procedureType: "undetermined",
      confidence: "pendiente de revisión",
      explanation: `Para trabajar en España con ${input.degree} obtenido en ${input.countryName}, primero debe identificarse la profesión española concreta y sus efectos. La plataforma no clasifica jurídicamente por palabras del título extranjero.`,
      nextSteps: [
        "Identificar la profesión regulada española de referencia.",
        "Revisar si el certificado académico incluye duración, asignaturas y carga horaria.",
        "Separar homologación, equivalencia, convalidación, reconocimiento profesional UE, empleo público y extranjería.",
      ],
      version: DIAGNOSTIC_VERSION,
      sourceBasis: "RD 889/2022 activo y reglas internas versionadas; sin proyecto normativo 2026.",
      requiresHumanReview: true,
    };
  }

  return {
    route: "Revisión entre homologación y equivalencia",
    procedureType: "undetermined",
    confidence: "inicial",
    explanation: `Con los datos de ${input.degree} obtenido en ${input.countryName}, todavía necesitamos conocer la profesión española que quieres ejercer y revisar si está regulada.`,
    nextSteps: [
      "Indicar el puesto o profesión que deseas ejercer en España.",
      "Comprobar si esa profesión está regulada.",
      "Revisar el plan de estudios antes de elegir el procedimiento.",
    ],
    version: DIAGNOSTIC_VERSION,
    sourceBasis: "RD 889/2022 activo y reglas internas versionadas; sin proyecto normativo 2026.",
    requiresHumanReview: true,
  };
}

export function objectiveForDatabase(objective: DiagnosticObjective) {
  return objective === "unknown" ? "other" : objective;
}

export function countryCodeForDatabase(country: string) {
  return country === "OTHER" ? null : country;
}
