export type CaseProcedureType =
  | "undetermined"
  | "homologation"
  | "equivalence"
  | "validation"
  | "professional_recognition";

export type CaseStatus =
  | "draft"
  | "diagnosed"
  | "collecting_documents"
  | "ready_for_review"
  | "submitted"
  | "under_review"
  | "subsanation_required"
  | "resolved_favorable"
  | "resolved_conditional"
  | "resolved_unfavorable"
  | "closed";

export type CaseSummary = {
  id: string;
  title: string;
  degreeName: string;
  procedureType: CaseProcedureType;
  status: CaseStatus;
  updatedAt: string;
};

export type CaseDetail = CaseSummary & {
  userId: string;
  originCountryCode: string | null;
  institutionName: string | null;
  professionCode: string | null;
  objective: "work" | "academic" | "study" | "other";
  diagnosticVersion: string | null;
  diagnosticPayload: unknown;
  officialCaseNumber: string | null;
  submittedAt: string | null;
  createdAt: string;
};

export type CreateCaseInput = {
  userId: string;
  title: string;
  originCountryCode: string | null;
  degreeName: string;
  institutionName?: string | null;
  professionCode?: string | null;
  objective: "work" | "academic" | "study" | "other";
  procedureType: CaseProcedureType;
  diagnosticVersion: string | null;
  diagnosticPayload: unknown;
};

/**
 * Contrato de persistencia de expedientes.
 *
 * Todas las operaciones reciben el userId interno para que la implementación
 * aplique el filtro de propietario incluso si la ruta o la interfaz son alteradas.
 */
export interface CaseRepository {
  listRecentByUser(userId: string, limit: number): Promise<CaseSummary[]>;
  getByIdForUser(caseId: string, userId: string): Promise<CaseDetail | null>;
  create(input: CreateCaseInput): Promise<{ id: string }>;
}
