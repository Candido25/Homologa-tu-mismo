import { NextResponse } from "next/server";
import { evaluateDiagnostic, parseDiagnosticInput } from "@/modules/diagnostics/evaluate";

export async function POST(request: Request) {
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

  return NextResponse.json(evaluateDiagnostic(parsed.input));
}
