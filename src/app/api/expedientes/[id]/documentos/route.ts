import { NextResponse } from "next/server";
import {
  getCurrentUserProvider,
  getDocumentService,
  isDocumentFlowConfigured,
} from "@/lib/application-services";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function unavailable() {
  return NextResponse.json(
    { error: "El flujo documental privado todavía no está configurado." },
    { status: 503 },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  if (!isDocumentFlowConfigured()) return unavailable();

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { id: caseId } = await context.params;

  try {
    const documents = await getDocumentService().list(caseId, user.id);
    if (!documents) {
      return NextResponse.json({ error: "No tienes permiso o el expediente no existe." }, { status: 404 });
    }
    return NextResponse.json(
      { documents },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("document_list_failed", {
      caseId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "No pudimos listar los documentos." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origen de solicitud no permitido." }, { status: 403 });
  }

  if (!isDocumentFlowConfigured()) return unavailable();

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { id: caseId } = await context.params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formato de carga inválido." }, { status: 400 });
  }

  const file = formData.get("archivo");
  const documentTypeCode = formData.get("tipoDocumento");

  if (!(file instanceof File) || typeof documentTypeCode !== "string") {
    return NextResponse.json({ error: "Faltan datos obligatorios." }, { status: 422 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "El archivo está vacío." }, { status: 422 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo supera el tamaño máximo permitido." }, { status: 413 });
  }

  const mimeType = file.type;
  if (mimeType !== "application/pdf" && mimeType !== "image/jpeg" && mimeType !== "image/png") {
      return NextResponse.json({ error: "Tipo de archivo no admitido." }, { status: 415 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const content = new Uint8Array(buffer);

    // extra simple mock validation for tests
    const text = new TextDecoder().decode(content.slice(0, 10));
    if (mimeType === "application/pdf" && !text.includes("%PDF")) {
       return NextResponse.json({ error: "El archivo no es válido." }, { status: 422 });
    }

    const result = await getDocumentService().upload({
      caseId,
      userId: user.id,
      documentTypeCode,
      filename: file.name,
      mimeType: mimeType as any,
      content,
    });

    if (!result.ok) {
       if (result.reason === "case_not_found") {
           return NextResponse.json({ error: "No tienes permiso para cargar en este expediente." }, { status: 404 });
       }
       if (result.reason === "document_type_not_found") {
           return NextResponse.json({ error: "Tipo de documento desconocido." }, { status: 422 });
       }
       return NextResponse.json({ error: "No se pudo cargar el documento" }, { status: 422 });
    }

    return NextResponse.json(
      {
        document: {
          id: result.document.id,
          documentTypeCode: result.document.documentTypeCode,
          originalFilename: result.document.originalFilename,
          sizeBytes: result.document.sizeBytes,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("document_upload_failed", {
      caseId,
      message: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { error: "No pudimos cargar el documento. Revisa tu conexión." },
      { status: 500 },
    );
  }
}
