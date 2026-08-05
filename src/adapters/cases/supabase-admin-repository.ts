import "server-only";

import type { AdminCaseDetail, AdminCaseSummary, AdminCaseRepository, AdminCaseFilters } from "@/core/cases/admin-repository";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { CaseProcedureType, CaseStatus, CaseTier, CaseStage, CaseDetail } from "@/core/cases/case-repository";

export class SupabaseAdminRepository implements AdminCaseRepository {
  private getClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase service role configuration is missing.");
    }

    return createServiceClient(supabaseUrl, supabaseServiceKey);
  }

  async listAllCases(limit: number, filters?: AdminCaseFilters): Promise<AdminCaseSummary[]> {
    const supabase = this.getClient();
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 200);

    let query = supabase
      .from("cases")
      .select(`
        id, title, degree_name, procedure_type, status, tier, current_stage, updated_at, user_id
      `)
      .order("updated_at", { ascending: false })
      .limit(safeLimit);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.tier) {
      query = query.eq("tier", filters.tier);
    }
    if (filters?.query) {
      // NOTE: supabase RPC or complex text search across multiple joined tables
      // might be required for full query functionality.
      query = query.or(`title.ilike.%${filters.query}%,degree_name.ilike.%${filters.query}%`);
    }

    const { data, error } = await query;

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

    const row = data as Record<string, unknown>;

    return {
      id: String(row.id),
      title: String(row.title),
      degreeName: String(row.degree_name),
      procedureType: row.procedure_type as CaseProcedureType,
      status: row.status as CaseStatus,
      tier: (row.tier as CaseTier) || "FREE",
      currentStage: (row.current_stage as CaseStage) || "PREPARACION_DOCUMENTAL",
      updatedAt: String(row.updated_at),
      userId: String(row.user_id),
      originCountryCode: row.origin_country_code ? String(row.origin_country_code) : null,
      institutionName: row.institution_name ? String(row.institution_name) : null,
      professionCode: row.profession_code ? String(row.profession_code) : null,
      objective: row.objective as CaseDetail["objective"],
      diagnosticVersion: row.diagnostic_version ? String(row.diagnostic_version) : null,
      diagnosticPayload: row.diagnostic_payload,
      officialCaseNumber: row.official_case_number ? String(row.official_case_number) : null,
      submittedAt: row.submitted_at ? String(row.submitted_at) : null,
      createdAt: String(row.created_at),
      userName: "Usuario",
      userEmail: "usuario@example.com",
    };
  }
}
