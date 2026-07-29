import "server-only";

import type {
  CaseDetail,
  CaseProcedureType,
  CaseRepository,
  CaseStatus,
  CaseSummary,
  CreateCaseInput,
} from "@/core/cases/case-repository";
import { createClient } from "@/lib/supabase/server";

type SupabaseCaseRow = {
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
  diagnostic_version: string | null;
  diagnostic_payload: unknown;
  official_case_number: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapSummary(row: Pick<SupabaseCaseRow, "id" | "title" | "degree_name" | "procedure_type" | "status" | "updated_at">): CaseSummary {
  return {
    id: row.id,
    title: row.title,
    degreeName: row.degree_name,
    procedureType: row.procedure_type,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export class SupabaseCaseRepository implements CaseRepository {
  async listRecentByUser(userId: string, limit: number): Promise<CaseSummary[]> {
    const supabase = await createClient();
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
    const { data, error } = await supabase
      .from("cases")
      .select("id,title,degree_name,procedure_type,status,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(safeLimit);

    if (error) throw new Error(`No se pudieron leer los expedientes: ${error.code}`);
    return (data || []).map((row) => mapSummary(row as SupabaseCaseRow));
  }

  async getByIdForUser(caseId: string, userId: string): Promise<CaseDetail | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cases")
      .select(
        "id,user_id,title,degree_name,origin_country_code,institution_name,profession_code,objective,procedure_type,status,diagnostic_version,diagnostic_payload,official_case_number,submitted_at,created_at,updated_at",
      )
      .eq("id", caseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(`No se pudo leer el expediente: ${error.code}`);
    if (!data) return null;

    const row = data as SupabaseCaseRow;
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
      submittedAt: row.submitted_at,
      createdAt: row.created_at,
    };
  }

  async create(input: CreateCaseInput): Promise<{ id: string }> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cases")
      .insert({
        user_id: input.userId,
        title: input.title,
        origin_country_code: input.originCountryCode,
        degree_name: input.degreeName,
        institution_name: input.institutionName ?? null,
        profession_code: input.professionCode ?? null,
        objective: input.objective,
        procedure_type: input.procedureType,
        diagnostic_version: input.diagnosticVersion,
        diagnostic_payload: input.diagnosticPayload,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`No se pudo crear el expediente: ${error?.code || "unknown"}`);
    }

    return { id: data.id };
  }
}
