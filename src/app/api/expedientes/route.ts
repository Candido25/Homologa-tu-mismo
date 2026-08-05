import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  getCaseRepository,
  getCurrentUserProvider,
  isPrivateAreaConfigured,
} from "@/lib/application-services";
import {
  countryCodeForDatabase,
  evaluateDiagnostic,
  objectiveForDatabase,
  parseDiagnosticInput,
} from "@/modules/diagnostics/evaluate";

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origen de solicitud no permitido." }, { status: 403 });
  }

  if (!isPrivateAreaConfigured()) {
    console.error("private_area_not_configured", {
      reason: "isPrivateAreaConfigured returned false, indicating either auth provider or application data is not configured correctly."
    });
    return NextResponse.json({ error: "En este momento no podemos procesar tu solicitud debido a un problema de configuración en nuestros servidores. Por favor, inténtalo más tarde." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La solicitud enviada no es válida." }, { status: 400 });
  }

  const parsed = parseDiagnosticInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión para guardar el expediente." }, { status: 401 });
  }

  const result = evaluateDiagnostic(parsed.input);
  const title = `${result.route}: ${parsed.input.degree}`.slice(0, 180);
  const diagnosticPayload = {
    input: parsed.input,
    result,
    savedAt: new Date().toISOString(),
    disclaimer: "Resultado preliminar y no vinculante.",
  };

  try {
    const data = await getCaseRepository().create({
      userId: user.id,
      title,
      originCountryCode: countryCodeForDatabase(parsed.input.country),
      degreeName: parsed.input.degree,
      objective: objectiveForDatabase(parsed.input.objective),
      procedureType: result.procedureType,
      diagnosticVersion: result.version,
      diagnosticPayload,
    });

    revalidatePath("/panel");
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (error) {
    console.error("case_create_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "No pudimos crear el expediente. Comprueba el entorno local y las migraciones." },
      { status: 500 },
    );
  }
}
