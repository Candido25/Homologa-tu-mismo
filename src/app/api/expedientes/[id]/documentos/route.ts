import { NextResponse } from "next/server";
import {
  getCurrentUserProvider,
  getDocumentService,
  isDocumentFlowConfigured,
} from "@/lib/application-services";
import {
  hasValidDocumentSignature,
  maxDocumentSize,
  parseAllowedMimeType,
} from "@/adapters/storage/document-storage-rules";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origen de solicitud no permitido." }, { status: 403 });
  }

  if (!isDocumentFlowConfigured()) {
    return NextResponse.json({ error: "El flujo documental privado todavía no está configurado." }, { status: 503 });
  }

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { id: caseId } = await context.params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "La solicitud no es válida." }, { status: 400 });
  }

  const file = formData.get("archivo");
  const documentTypeCode = formData.get("tipoDocumento");

  if (!(file instanceof File) || typeof documentTypeCode !== "string") {
    return NextResponse.json({ error: "Selecciona un archivo y un tipo documental." }, { status: 422 });
  }

  if (!/^[a-z][a-z0-9_]{1,63}$/.test(documentTypeCode)) {
    return NextResponse.json({ error: "El tipo documental no es válido." }, { status: 422 });
  }

  const mimeType = parseAllowedMimeType(file.type);
  if (!mimeType) {
    return NextResponse.json({ error: "Solo se permiten archivos PDF, JPEG y PNG." }, { status: 415 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "El documento está vacío." }, { status: 422 });
  }

  if (file.size > maxDocumentSize) {
    return NextResponse.json({ error: "El documento supera el límite de 25 MB." }, { status: 413 });
  }

  const content = new Uint8Array(await file.arrayBuffer());
  if (!hasValidDocumentSignature(content, mimeType)) {
    return NextResponse.json({ error: "El contenido del archivo no coincide con su tipo declarado." }, { status: 422 });
  }

  try {
    const result = await getDocumentService().upload({
      caseId,
      userId: user.id,
      documentTypeCode,
      filename: file.name,
      mimeType,
      content,
    });

    if (!result.ok) {
      if (result.reason === "case_not_found") {
        return NextResponse.json({ error: "Expediente no encontrado." }, { status: 404 });
      }
      return NextResponse.json({ error: "Tipo documental no encontrado." }, { status: 422 });
    }

    return NextResponse.json({ document: result.document }, { status: 201 });
  } catch (error) {
    console.error("document_upload_failed", {
      caseId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "No pudimos guardar el documento. Intenta nuevamente." }, { status: 500 });
  }
}

export async function GET(request: Request, context: RouteContext) {
  if (!isDocumentFlowConfigured()) {
    return NextResponse.json({ error: "El flujo documental privado todavía no está configurado." }, { status: 503 });
  }

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { id: caseId } = await context.params;

  try {
    const documents = await getDocumentService().list(caseId, user.id);
    if (!documents) {
      return NextResponse.json({ error: "Expediente no encontrado." }, { status: 404 });
    }

    return NextResponse.json(
      { documents },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("document_list_failed", {
      caseId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "No pudimos obtener la lista de documentos." }, { status: 500 });
  }
}
