import "server-only";

import type { AdminCaseDetail, AdminCaseSummary, AdminCaseRepository } from "@/core/cases/admin-repository";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { CaseProcedureType, CaseStatus, CaseTier, CaseStage, CaseDetail } from "@/core/cases/case-repository";

type SupabaseAdminCaseRow = {
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
  tier: CaseTier;
  current_stage: CaseStage;
  diagnostic_version: string | null;
  diagnostic_payload: unknown;
  official_case_number: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  app_users: {
    profiles: {
      display_name: string | null;
    }[];
    external_identities: {
      email: string | null;
    }[];
  } | null;
};

export class SupabaseAdminRepository implements AdminCaseRepository {
  private getClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase service role configuration is missing.");
    }

    return createServiceClient(supabaseUrl, supabaseServiceKey);
  }

  async listAllCases(limit: number): Promise<AdminCaseSummary[]> {
    const supabase = this.getClient();
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 200);

    const { data, error } = await supabase
      .from("cases")
      .select(`
        id, title, degree_name, procedure_type, status, tier, current_stage, updated_at, user_id
      `)
      .order("updated_at", { ascending: false })
      .limit(safeLimit);

    if (error) throw new Error(`No se pudieron leer los expedientes: ${error.message}`);

    return (data || []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      title: String(row.title),
      degreeName: String(row.degree_name),
      procedureType: row.procedure_type as CaseProcedureType,
      status: row.status as CaseStatus,
      tier: (row.tier as CaseTier) || "FREE",
      currentStage: (row.current_stage as CaseStage) || "PREPARACION_DOCUMENTAL",
      updatedAt: String(row.updated_at),
      userId: String(row.user_id),
      userName: "Usuario",
      userEmail: "usuario@example.com",
    }));
  }

  async getById(caseId: string): Promise<AdminCaseDetail | null> {
    const supabase = this.getClient();

    const { data, error } = await supabase
      .from("cases")
      .select(`
        id, user_id, title, degree_name, origin_country_code, institution_name,
        profession_code, objective, procedure_type, status, tier, current_stage,
        diagnostic_version, diagnostic_payload, official_case_number, submitted_at,
        created_at, updated_at
      `)
      .eq("id", caseId)
      .maybeSingle();

    if (error) throw new Error(`No se pudo leer el expediente: ${error.message}`);
    if (!data) return null;

    const row = data as SupabaseAdminCaseRow;

    return {
      id: row.id,
      title: row.title,
      degreeName: row.degree_name,
      procedureType: row.procedure_type,
      status: row.status,
      tier: row.tier || "FREE",
      currentStage: row.current_stage || "PREPARACION_DOCUMENTAL",
      updatedAt: row.updated_at,
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
      userName: "Usuario",
      userEmail: "usuario@example.com",
    };
  }
}
