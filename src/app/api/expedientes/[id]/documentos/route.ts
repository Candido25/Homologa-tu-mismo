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

export async function GET(_request: Request, context: RouteContext) {
  if (!isDocumentFlowConfigured()) {
    return NextResponse.json({ error: "No disponible" }, { status: 503 });
  }

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: caseId } = await context.params;

  try {
    const documents = await getDocumentService().list(caseId, user.id);
    return NextResponse.json(
      { documents },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origen de solicitud no permitido." }, { status: 403 });
  }

  if (!isDocumentFlowConfigured()) {
    return NextResponse.json({ error: "No disponible" }, { status: 503 });
  }

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: caseId } = await context.params;

  try {
    const formData = await request.formData();
    const documentType = formData.get("tipoDocumento") as string;
    const file = formData.get("archivo") as File;

    if (!file || !documentType) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 422 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Archivo vacio" }, { status: 422 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo demasiado grande" }, { status: 413 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "tipo de archivo no permitido" }, { status: 415 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.toString("utf8", 0, 10).includes("%PDF")) {
       return NextResponse.json({ error: "Mime suplantado" }, { status: 422 });
    }

    const result = await getDocumentService().upload({
      caseId,
      userId: user.id,
      documentTypeCode: documentType,
      filename: file.name,
      mimeType: "application/pdf",
      content: buffer
    });

    if (!result.ok) {
       if (result.reason === "case_not_found") {
           return NextResponse.json({ error: result.reason }, { status: 404 });
       }
       return NextResponse.json({ error: result.reason }, { status: 422 });
    }

    return NextResponse.json({ document: result.document }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
