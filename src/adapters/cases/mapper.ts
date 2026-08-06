import type {
  CaseProcedureType,
  CaseStage,
  CaseStatus,
  CaseSummary,
  CaseTier,
} from "@/core/cases/case-repository";

export function mapCaseSummary(row: {
  id: string;
  title: string;
  degree_name: string;
  procedure_type: CaseProcedureType;
  status: CaseStatus;
  tier: CaseTier;
  current_stage: CaseStage;
  updated_at: string | Date;
}): CaseSummary {
  const updatedAtIso =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : new Date(row.updated_at).toISOString();

  return {
    id: row.id,
    title: row.title,
    degreeName: row.degree_name,
    procedureType: row.procedure_type,
    status: row.status,
    tier: row.tier || "FREE",
    currentStage: row.current_stage || "PREPARACION_DOCUMENTAL",
    updatedAt: updatedAtIso,
  };
}
