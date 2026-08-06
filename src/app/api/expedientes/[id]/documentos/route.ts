import { NextResponse } from "next/server";
import { uploadCaseDocument, getCaseDocuments } from "@/app/panel/expedientes/[id]/actions";

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

  const { id: caseId } = await context.params;
  const formData = await request.formData();

  const result = await uploadCaseDocument(caseId, formData);
  if (!result.success) {
    let status = 400;
    if (result.code === "unauthenticated") status = 401;
    else if (result.code === "not_configured") status = 503;
    else if (result.code === "invalid_input") {
      if (result.error.includes("vacío")) status = 422;
      else if (result.error.includes("25 MB")) status = 413;
      else if (result.error.includes("no coincide")) status = 422;
      else if (result.error.includes("archivos PDF")) status = 415;
      else if (result.error.includes("no válido")) status = 422;
      else if (result.error.includes("Tipo documental")) status = 422;
    } else if (result.code === "not_found") {
      if (result.error.includes("Expediente")) status = 404;
    }
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ document: result.document }, { status: 201 });
}

export async function GET(request: Request, context: RouteContext) {
  const { id: caseId } = await context.params;
  const documents = await getCaseDocuments(caseId);
  return NextResponse.json({ documents }, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
