export const DIAGNOSTIC_VERSION = "prototype-2026-08-05";

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
export type DocumentStatusType = "ready" | "missing_apostille" | "missing_documents" | "unknown";

export type DiagnosticInput = {
  country: string;
  countryName: string;
  degree: string;
  objective: DiagnosticObjective;
  documentStatus: DocumentStatusType;
};

export type DiagnosticResult = {
  route: string;
  procedureType: ProcedureType;
  confidence: string;
  explanation: string;
  nextSteps: string[];
  version: string;
};

const regulatedTerms = [
  "ingeniería civil",
  "ingenieria civil",
  "arquitectura",
  "medicina",
  "enfermería",
  "enfermeria",
  "odontología",
  "odontologia",
  "farmacia",
  "veterinaria",
  "psicología sanitaria",
  "psicologia sanitaria",
  "educación",
  "educacion",
  "docente",
  "abogacía",
  "abogacia",
];

const objectiveValues = new Set<DiagnosticObjective>(["work", "study", "academic", "unknown"]);
const documentStatusValues = new Set<DocumentStatusType>(["ready", "missing_apostille", "missing_documents", "unknown"]);

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
  const documentStatusValue = typeof values.documentStatus === "string" ? values.documentStatus : "unknown";

  const country = resolveCountry(countryValue);

  if (!country || degree.length < 3 || degree.length > 180 || !objectiveValues.has(objectiveValue as DiagnosticObjective)) {
    return { ok: false, error: "Completa correctamente el país, el título y el objetivo principal." };
  }

  if (!documentStatusValues.has(documentStatusValue as DocumentStatusType)) {
     return { ok: false, error: "El estado de los documentos no es válido." };
  }

  return {
    ok: true,
    input: {
      country: country.code,
      countryName: country.name,
      degree,
      objective: objectiveValue as DiagnosticObjective,
      documentStatus: documentStatusValue as DocumentStatusType,
    },
  };
}

export function evaluateDiagnostic(input: DiagnosticInput): DiagnosticResult {
  const normalizedDegree = input.degree.toLocaleLowerCase("es");
  const appearsRegulated = regulatedTerms.some((term) => normalizedDegree.includes(term));

  const docStep = input.documentStatus === 'ready'
    ? "Comenzar a escanear los documentos para subirlos a la plataforma."
    : input.documentStatus === 'missing_apostille'
      ? "Tramitar la apostilla de la Haya en tu país de origen."
      : "Reunir título, certificado académico y documentos de identidad.";

  if (input.objective === "study") {
    return {
      route: "Convalidación de estudios",
      procedureType: "validation",
      confidence: "media",
      explanation: `Si estudiaste ${input.degree} en ${input.countryName} y quieres continuar estudios en España, normalmente la universidad española analiza qué asignaturas o créditos puede reconocerte.`,
      nextSteps: [
        "Elegir la universidad y el programa español de destino.",
        docStep,
        "Revisar los requisitos particulares de la universidad receptora.",
      ],
      version: DIAGNOSTIC_VERSION,
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
        docStep,
        "Comparar tu objetivo con los efectos jurídicos de la equivalencia.",
      ],
      version: DIAGNOSTIC_VERSION,
    };
  }

  if (input.objective === "work" && appearsRegulated) {
    return {
      route: "Homologación probable",
      procedureType: "homologation",
      confidence: "media-alta",
      explanation: `${input.degree} puede estar relacionado con una profesión regulada en España. Para ejercer, será necesario identificar la profesión española concreta a la que pretendes acceder y comparar tu formación.`,
      nextSteps: [
        "Identificar la profesión regulada española de referencia.",
        "Revisar si el certificado académico incluye duración, asignaturas y carga horaria.",
        docStep,
      ],
      version: DIAGNOSTIC_VERSION,
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
      docStep,
    ],
    version: DIAGNOSTIC_VERSION,
  };
}

export function objectiveForDatabase(objective: DiagnosticObjective) {
  return objective === "unknown" ? "other" : objective;
}

export function countryCodeForDatabase(country: string) {
  return country === "OTHER" ? null : country;
}
