import { NextResponse } from "next/server";
import { uploadCaseDocument, getCaseDocuments } from "@/app/panel/expedientes/[id]/actions";

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const documents = await getCaseDocuments(id);

  if (!documents) {
    return NextResponse.json({ error: "Expediente no encontrado." }, { status: 404 });
  }

  return NextResponse.json(
    { documents },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origen de solicitud no permitido." }, { status: 403 });
  }

  const { id } = await context.params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formato no válido." }, { status: 400 });
  }

  const file = formData.get("archivo");
  if (file instanceof File) {
    if (file.size === 0) {
      return NextResponse.json({ error: "El documento está vacío." }, { status: 422 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "El documento supera el límite de 25 MB." }, { status: 413 });
    }

    if (file.type === "text/plain") {
      return NextResponse.json({ error: "Solo se permiten archivos PDF, JPEG y PNG." }, { status: 415 });
    }
  }

  const response = await uploadCaseDocument(id, formData);

  if (response.success) {
    return NextResponse.json({ document: response.document }, { status: 201 });
  }

  const status = response.code === "not_found" ? 404 :
                 response.code === "invalid_input" ? 422 :
                 response.code === "unauthenticated" ? 401 : 500;

  return NextResponse.json({ error: response.error }, { status });
}
