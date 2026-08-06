import type { CaseSummary, CaseProcedureType, CaseStatus, CaseTier, CaseStage } from "@/core/cases/case-repository";

export function mapSummary(row: {
  id: string;
  title: string;
  degree_name: string;
  procedure_type: string | CaseProcedureType;
  status: string | CaseStatus;
  tier?: string | CaseTier | null;
  current_stage?: string | CaseStage | null;
  updated_at: string | Date;
}): CaseSummary {
  return {
    id: row.id,
    title: row.title,
    degreeName: row.degree_name,
    procedureType: row.procedure_type as CaseProcedureType,
    status: row.status as CaseStatus,
    tier: (row.tier as CaseTier) || "FREE",
    currentStage: (row.current_stage as CaseStage) || "PREPARACION_DOCUMENTAL",
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString(),
  };
}
