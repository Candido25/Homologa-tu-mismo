import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
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

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "La base de datos todavía no está configurada." }, { status: 503 });
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const { data, error } = await supabase
    .from("cases")
    .insert({
      user_id: user.id,
      title,
      origin_country_code: countryCodeForDatabase(parsed.input.country),
      degree_name: parsed.input.degree,
      objective: objectiveForDatabase(parsed.input.objective),
      procedure_type: result.procedureType,
      diagnostic_version: result.version,
      diagnostic_payload: diagnosticPayload,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("case_create_failed", { code: error?.code, message: error?.message });
    return NextResponse.json(
      { error: "No pudimos crear el expediente. Comprueba que las migraciones estén aplicadas." },
      { status: 500 },
    );
  }

  revalidatePath("/panel");
  return NextResponse.json({ id: data.id }, { status: 201 });
}
