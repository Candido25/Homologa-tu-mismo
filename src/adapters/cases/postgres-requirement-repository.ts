import "server-only";

import type { CaseRequirement, RequirementRepository, RequirementStatus } from "@/core/cases/requirement-repository";
import { query } from "@/lib/postgres/pool";

type RequirementRow = {
  id: string;
  case_id: string;
  document_type_code: string;
  required: boolean;
  status: RequirementStatus;
  reason: string | null;
  due_date: Date | string | null;
  updated_at: Date | string;
};

function isoDate(value: Date | string) {
  if (!value) return null;
  const d = new Date(value);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export class PostgresRequirementRepository implements RequirementRepository {
  async listByCaseForUser(caseId: string, userId: string): Promise<CaseRequirement[]> {
    const result = await query<RequirementRow>(
      [
        "select r.id, r.case_id, r.document_type_code, r.required, r.status, r.reason, r.due_date, r.updated_at",
        "from case_requirements r",
        "join cases c on c.id = r.case_id",
        "where r.case_id = $1 and c.user_id = $2",
      ].join(" "),
      [caseId, userId],
    );

    return result.rows.map(row => ({
      id: row.id,
      caseId: row.case_id,
      documentTypeCode: row.document_type_code,
      required: row.required,
      status: row.status,
      reason: row.reason,
      dueDate: row.due_date ? isoDate(row.due_date) : null,
      updatedAt: iso(row.updated_at),
    }));
  }

  async updateStatus(caseId: string, userId: string, documentTypeCode: string, status: RequirementStatus): Promise<void> {
    // Verify case ownership and update at the same time using a CTE or explicit join (CTE for Postgres)
    await query(
      [
        "update case_requirements r set status = $1, updated_at = now()",
        "from cases c",
        "where r.case_id = c.id and r.case_id = $2 and c.user_id = $3 and r.document_type_code = $4",
      ].join(" "),
      [status, caseId, userId, documentTypeCode]
    );
  }
}
