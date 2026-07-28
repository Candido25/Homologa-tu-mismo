import { NextResponse } from "next/server";

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

type DiagnosticRequest = {
  country?: unknown;
  degree?: unknown;
  objective?: unknown;
};

export async function POST(request: Request) {
  let body: DiagnosticRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La solicitud enviada no es válida." }, { status: 400 });
  }

  const country = typeof body.country === "string" ? body.country.trim() : "";
  const degree = typeof body.degree === "string" ? body.degree.trim() : "";
  const objective = typeof body.objective === "string" ? body.objective : "";

  if (!country || degree.length < 3 || !objective) {
    return NextResponse.json(
      { error: "Completa el país, el título y el objetivo principal." },
      { status: 422 },
    );
  }

  const normalizedDegree = degree.toLocaleLowerCase("es");
  const appearsRegulated = regulatedTerms.some((term) => normalizedDegree.includes(term));

  if (objective === "study") {
    return NextResponse.json({
      route: "Convalidación de estudios",
      confidence: "media",
      explanation: `Si estudiaste ${degree} en ${country} y quieres continuar estudios en España, normalmente la universidad española analiza qué asignaturas o créditos puede reconocerte.`,
      nextSteps: [
        "Elegir la universidad y el programa español de destino.",
        "Solicitar certificado académico y contenidos de las asignaturas.",
        "Revisar los requisitos particulares de la universidad receptora.",
      ],
    });
  }

  if (objective === "academic") {
    return NextResponse.json({
      route: "Equivalencia académica probable",
      confidence: "media",
      explanation: `Tu objetivo parece ser acreditar en España el nivel académico de ${degree}, sin vincularlo todavía al ejercicio de una profesión regulada.`,
      nextSteps: [
        "Confirmar si la profesión que deseas ejercer está regulada en España.",
        "Reunir título, certificado académico y documentación legalizada.",
        "Comparar tu objetivo con los efectos jurídicos de la equivalencia.",
      ],
    });
  }

  if (objective === "work" && appearsRegulated) {
    return NextResponse.json({
      route: "Homologación probable",
      confidence: "media-alta",
      explanation: `${degree} puede estar relacionado con una profesión regulada en España. Para ejercer, será necesario identificar la profesión española concreta a la que pretendes acceder y comparar tu formación.`,
      nextSteps: [
        "Identificar la profesión regulada española de referencia.",
        "Revisar si el certificado académico incluye duración, asignaturas y carga horaria.",
        "Comprobar apostilla, identidad y demás documentos obligatorios.",
      ],
    });
  }

  return NextResponse.json({
    route: "Revisión entre homologación y equivalencia",
    confidence: "inicial",
    explanation: `Con los datos de ${degree} obtenido en ${country}, todavía necesitamos conocer la profesión española que quieres ejercer y revisar si está regulada.`,
    nextSteps: [
      "Indicar el puesto o profesión que deseas ejercer en España.",
      "Comprobar si esa profesión está regulada.",
      "Revisar el plan de estudios antes de elegir el procedimiento.",
    ],
  });
}
