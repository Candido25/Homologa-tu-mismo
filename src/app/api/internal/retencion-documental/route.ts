import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getDocumentRetentionService,
  isDocumentDataConfigured,
} from "@/lib/application-services";
import {
  getDocumentRetentionJobToken,
  isDocumentRetentionJobConfigured,
} from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expected = getDocumentRetentionJobToken();
  const providedHash = createHash("sha256").update(provided).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

export async function POST(request: Request) {
  if (!isDocumentDataConfigured() || !isDocumentRetentionJobConfigured()) {
    return NextResponse.json(
      { error: "El proceso de retención documental no está configurado." },
      { status: 503 },
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Credencial interna no válida." }, { status: 401 });
  }

  const requestedLimit = Number.parseInt(new URL(request.url).searchParams.get("limit") || "50", 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 50;

  try {
    const result = await getDocumentRetentionService().run(limit);
    if (result.failed > 0) {
      console.error("document_retention_job_failed", result);
    } else {
      console.info("document_retention_job_completed", result);
    }
    return NextResponse.json(
      {
        ok: result.failed === 0,
        ...result,
      },
      {
        status: result.failed === 0 ? 200 : 500,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("document_retention_job_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "No pudimos ejecutar la retención documental." },
      { status: 500 },
    );
  }
}
