import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type {
  DocumentSummary,
  DocumentType,
} from "@/core/documents/document-repository";
import {
  getCaseRepository,
  getCurrentUserProvider,
  getDocumentService,
  isDocumentInterfaceEnabled,
  isPrivateAreaConfigured,
} from "@/lib/application-services";
import { CaseViewClient } from "./case-view-client";
import { TimelineClient } from "./timeline-client";
import { getCaseTimelineAction } from "./timeline-actions";
import { CaseHeader } from "./case-header";
import { CaseOrientation } from "./case-orientation";
import { CaseSummarySidebar } from "./case-summary-sidebar";

export const metadata: Metadata = { title: "Mi expediente" };
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type DiagnosticPayload = {
  result?: {
    route?: string;
    confidence?: string;
    explanation?: string;
    nextSteps?: string[];
  };
  input?: {
    countryName?: string;
  };
};

function readPayload(value: unknown): DiagnosticPayload {
  return value && typeof value === "object" ? (value as DiagnosticPayload) : {};
}

export default async function CasePage({ params }: PageProps) {
  if (!isPrivateAreaConfigured()) redirect("/panel");

  const { id } = await params;
  const user = await getCurrentUserProvider().getCurrentUser();

  if (!user) redirect(`/iniciar-sesion?siguiente=${encodeURIComponent(`/panel/expedientes/${id}`)}`);

  let caseItem;
  try {
    caseItem = await getCaseRepository().getByIdForUser(id, user.id);
  } catch (error) {
    console.error("case_read_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    notFound();
  }

  if (!caseItem) notFound();

  const payload = readPayload(caseItem.diagnosticPayload);
  const result = payload.result;
  const documentInterfaceEnabled = isDocumentInterfaceEnabled();
  let initialDocuments: DocumentSummary[] = [];
  let documentTypes: DocumentType[] = [];

  if (documentInterfaceEnabled) {
    try {
      const documents = getDocumentService();
      [initialDocuments, documentTypes] = await Promise.all([
        documents.list(id, user.id).then((items) => items || []),
        documents.listTypes(),
      ]);
    } catch (error) {
      console.error("document_interface_load_failed", {
        caseId: id,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  const procedure = caseItem.procedureType;
  const currentStage = caseItem.currentStage;
  const timeline = await getCaseTimelineAction(id);

  return (
    <div className="bg-soft min-h-screen pb-12">
      <CaseHeader
        degreeName={caseItem.degreeName}
        route={result?.route}
        title={caseItem.title}
      />

      <section className="container mx-auto px-6 mt-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-6">
          <CaseOrientation
            createdAt={caseItem.createdAt}
            route={result?.route}
            explanation={result?.explanation}
            confidence={result?.confidence}
          />

          <CaseViewClient
            caseId={id}
            procedure={procedure}
            initialDocuments={initialDocuments}
            documentTypes={documentTypes}
            documentInterfaceEnabled={documentInterfaceEnabled}
          />

          <TimelineClient
            caseId={id}
            currentStage={currentStage}
            initialTimeline={timeline}
          />
        </div>

        <CaseSummarySidebar
          status={caseItem.status}
          countryName={payload.input?.countryName}
          originCountryCode={caseItem.originCountryCode}
          objective={caseItem.objective}
          updatedAt={caseItem.updatedAt}
        />
      </section>
    </div>
  );
}
