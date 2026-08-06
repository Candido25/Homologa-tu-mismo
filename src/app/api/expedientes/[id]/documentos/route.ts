import { NextResponse } from "next/server";
import { uploadCaseDocument, getCaseDocuments } from "@/app/panel/expedientes/[id]/actions";

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origen de solicitud no permitido." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "La solicitud enviada no es válida." }, { status: 400 });
  }

  const result = await uploadCaseDocument(params.id, formData);

  if (result.success) {
    return NextResponse.json({ document: result.document }, { status: 201 });
  }

  if (result.code === "unauthenticated") return NextResponse.json({ error: result.error }, { status: 401 });
  if (result.code === "not_found") return NextResponse.json({ error: result.error }, { status: 404 });
  if (result.error === "Solo se permiten archivos PDF, JPEG y PNG.") return NextResponse.json({ error: result.error }, { status: 415 });
  if (result.error === "El documento supera el límite de 25 MB.") return NextResponse.json({ error: result.error }, { status: 413 });
  if (result.code === "invalid_input") return NextResponse.json({ error: result.error }, { status: 422 });
  if (result.code === "not_configured") return NextResponse.json({ error: result.error }, { status: 503 });

  return NextResponse.json({ error: result.error }, { status: 500 });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const documents = await getCaseDocuments(params.id);
  return NextResponse.json({ documents }, { headers: { "cache-control": "private, no-store" } });
}
