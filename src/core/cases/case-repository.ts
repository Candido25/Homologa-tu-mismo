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

export type CaseTier = "FREE" | "PREMIUM";

export type CaseStage =
  | "PREPARACION_DOCUMENTAL"
  | "APOSTILLA_Y_LEGALIZACION"
  | "PAGO_TASA_790_070"
  | "PRESENTACION_SEDE_ELECTRONICA"
  | "EN_REVISION_MINISTERIO"
  | "SUBSANACION_REQUERIDA"
  | "RESOLUCION_OFICIAL";

export type CaseSummary = {
  id: string;
  title: string;
  degreeName: string;
  procedureType: CaseProcedureType;
  status: CaseStatus;
  tier: CaseTier;
  currentStage: CaseStage;
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

export type CaseActivityLog = {
  id: string;
  caseId: string;
  title: string;
  description: string;
  createdAt: string;
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
  updateTier(caseId: string, tier: CaseTier): Promise<void>;
  updateStage(caseId: string, userId: string, newStage: CaseStage, note?: string): Promise<void>;
  addLogEntry(caseId: string, userId: string, title: string, description: string): Promise<void>;
  getTimeline(caseId: string, userId: string): Promise<CaseActivityLog[]>;
}
