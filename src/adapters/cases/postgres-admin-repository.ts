import "server-only";

import type { AdminCaseDetail, AdminCaseSummary, AdminCaseRepository } from "@/core/cases/admin-repository";
import type { CaseProcedureType, CaseStatus, CaseTier, CaseStage, CaseDetail } from "@/core/cases/case-repository";
import { query } from "@/lib/postgres/pool";

type AdminCaseRow = {
  id: string;
  user_id: string;
  title: string;
  degree_name: string;
  origin_country_code: string | null;
  institution_name: string | null;
  profession_code: string | null;
  objective: CaseDetail["objective"];
  procedure_type: CaseProcedureType;
  status: CaseStatus;
  tier?: CaseTier;
  current_stage?: CaseStage;
  diagnostic_version: string | null;
  diagnostic_payload: unknown;
  official_case_number: string | null;
  submitted_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  display_name: string | null;
  email: string | null;
};

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function optionalIso(value: Date | string | null) {
  return value ? iso(value) : null;
}

export class PostgresAdminRepository implements AdminCaseRepository {
  async listAllCases(limit: number): Promise<AdminCaseSummary[]> {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 200);
    const result = await query<AdminCaseRow>(
      [
        "select c.id, c.user_id, c.title, c.degree_name, c.procedure_type, c.status, c.updated_at, p.display_name, i.email",
        "from cases c",
        "left join profiles p on p.id = c.user_id",
        "left join external_identities i on i.user_id = c.user_id",
        "order by c.updated_at desc",
        "limit $1",
      ].join(" "),
      [safeLimit],
    );

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      degreeName: row.degree_name,
      procedureType: row.procedure_type,
      status: row.status,
      tier: "FREE",
      currentStage: "PREPARACION_DOCUMENTAL",
      updatedAt: iso(row.updated_at),
      userId: row.user_id,
      userName: row.display_name,
      userEmail: row.email,
    }));
  }

  async getById(caseId: string): Promise<AdminCaseDetail | null> {
    const result = await query<AdminCaseRow>(
      [
        "select c.*, p.display_name, i.email",
        "from cases c",
        "left join profiles p on p.id = c.user_id",
        "left join external_identities i on i.user_id = c.user_id",
        "where c.id = $1",
        "limit 1",
      ].join(" "),
      [caseId],
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      degreeName: row.degree_name,
      procedureType: row.procedure_type,
      status: row.status,
      tier: "FREE",
      currentStage: "PREPARACION_DOCUMENTAL",
      updatedAt: iso(row.updated_at),
      userId: row.user_id,
      originCountryCode: row.origin_country_code,
      institutionName: row.institution_name,
      professionCode: row.profession_code,
      objective: row.objective,
      diagnosticVersion: row.diagnostic_version,
      diagnosticPayload: row.diagnostic_payload,
      officialCaseNumber: row.official_case_number,
      submittedAt: optionalIso(row.submitted_at),
      createdAt: iso(row.created_at),
      userName: row.display_name,
      userEmail: row.email,
    };
  }
}
