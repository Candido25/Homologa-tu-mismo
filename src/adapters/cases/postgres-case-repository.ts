import "server-only";

import type {
  CaseDetail,
  CaseRepository,
  CaseStatus,
  CaseSummary,
  CaseProcedureType,
  CreateCaseInput,
} from "@/core/cases/case-repository";
import { query } from "@/lib/postgres/pool";

type SummaryRow = {
  id: string;
  title: string;
  degree_name: string;
  procedure_type: CaseProcedureType;
  status: CaseStatus;
  updated_at: Date | string;
};

type DetailRow = SummaryRow & {
  user_id: string;
  origin_country_code: string | null;
  institution_name: string | null;
  profession_code: string | null;
  objective: CaseDetail["objective"];
  diagnostic_version: string | null;
  diagnostic_payload: unknown;
  official_case_number: string | null;
  submitted_at: Date | string | null;
  created_at: Date | string;
};

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function optionalIso(value: Date | string | null) {
  return value ? iso(value) : null;
}

function mapSummary(row: SummaryRow): CaseSummary {
  return {
    id: row.id,
    title: row.title,
    degreeName: row.degree_name,
    procedureType: row.procedure_type,
    status: row.status,
    updatedAt: iso(row.updated_at),
  };
}

export class PostgresCaseRepository implements CaseRepository {
  async listRecentByUser(userId: string, limit: number): Promise<CaseSummary[]> {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
    const result = await query<SummaryRow>(
      [
        "select id, title, degree_name, procedure_type, status, updated_at",
        "from cases",
        "where user_id = $1",
        "order by updated_at desc",
        "limit $2",
      ].join(" "),
      [userId, safeLimit],
    );

    return result.rows.map(mapSummary);
  }

  async getByIdForUser(caseId: string, userId: string): Promise<CaseDetail | null> {
    const result = await query<DetailRow>(
      [
        "select id, user_id, title, degree_name, origin_country_code, institution_name,",
        "profession_code, objective, procedure_type, status, diagnostic_version,",
        "diagnostic_payload, official_case_number, submitted_at, created_at, updated_at",
        "from cases",
        "where id = $1 and user_id = $2",
        "limit 1",
      ].join(" "),
      [caseId, userId],
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      ...mapSummary(row),
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
    };
  }

  async create(input: CreateCaseInput): Promise<{ id: string }> {
    const result = await query<{ id: string }>(
      [
        "insert into cases (",
        "user_id, title, origin_country_code, degree_name, institution_name,",
        "profession_code, objective, procedure_type, diagnostic_version, diagnostic_payload",
        ") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)",
        "returning id",
      ].join(" "),
      [
        input.userId,
        input.title,
        input.originCountryCode,
        input.degreeName,
        input.institutionName ?? null,
        input.professionCode ?? null,
        input.objective,
        input.procedureType,
        input.diagnosticVersion,
        JSON.stringify(input.diagnosticPayload ?? {}),
      ],
    );

    return { id: result.rows[0].id };
  }
}
