import { NextResponse } from "next/server";
import {
  getCurrentUserProvider,
  getDocumentService,
  isDocumentFlowConfigured,
} from "@/lib/application-services";

type RouteContext = {
  params: Promise<{ id: string; documentId: string }>;
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

function contentDisposition(filename: string) {
  const fallback = filename
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, "_")
    .replace(/["\\]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(_request: Request, context: RouteContext) {
  if (!isDocumentFlowConfigured()) return unavailable();

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { id: caseId, documentId } = await context.params;

  try {
    const document = await getDocumentService().read(documentId, caseId, user.id);
    if (!document) {
      return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
    }

    return new Response(Uint8Array.from(document.content).buffer, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": contentDisposition(document.filename),
        "Content-Length": String(document.sizeBytes),
        "Content-Type": document.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("document_read_failed", {
      caseId,
      documentId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "No pudimos recuperar el documento." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origen de solicitud no permitido." }, { status: 403 });
  }

  if (!isDocumentFlowConfigured()) return unavailable();

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { id: caseId, documentId } = await context.params;

  try {
    const deleted = await getDocumentService().delete(documentId, caseId, user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("document_delete_failed", {
      caseId,
      documentId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "No pudimos eliminar el documento." },
      { status: 500 },
    );
  }
}
