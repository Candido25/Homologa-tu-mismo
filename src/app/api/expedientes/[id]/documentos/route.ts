import { NextResponse } from "next/server";
import { uploadCaseDocument, getCaseDocuments } from "@/app/panel/expedientes/[id]/actions";

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origen de solicitud no permitido." }, { status: 403 });
  }

  const { id: caseId } = await context.params;
  const formData = await request.formData();

  const result = await uploadCaseDocument(caseId, formData);

  if (result.success) {
    return NextResponse.json({ document: result.document }, { status: 201 });
  } else {
    let status = 400;
    if (result.code === "unauthenticated") status = 401;
    if (result.code === "not_configured") status = 503;
    if (result.code === "not_found") status = 404;
    if (result.code === "invalid_input") {
      const errorMsg = result.error.toLowerCase();
      if (errorMsg.includes("vacío") || errorMsg.includes("tipo documental no es válido") || errorMsg.includes("no coincide")) {
        status = 422;
      } else if (errorMsg.includes("solo se permiten")) {
        status = 415;
      } else if (errorMsg.includes("límite")) {
        status = 413;
      } else {
        status = 422;
      }
    }
    return NextResponse.json({ error: result.error }, { status });
  }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await context.params;
  const documents = await getCaseDocuments(caseId);
  return NextResponse.json({ documents }, {
    status: 200,
    headers: { "Cache-Control": "private, no-store" }
  });
}
