import "server-only";

import type { CaseRequirement, RequirementRepository, RequirementStatus } from "@/core/cases/requirement-repository";
import { createClient } from "@/lib/supabase/server";

export class SupabaseRequirementRepository implements RequirementRepository {
  async listByCaseForUser(caseId: string, userId: string): Promise<CaseRequirement[]> {
    const supabase = await createClient();

    // Check ownership first
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (caseError || !caseData) return [];

    const { data, error } = await supabase
      .from("case_requirements")
      .select("id, case_id, document_type_code, required, status, reason, due_date, updated_at")
      .eq("case_id", caseId);

    if (error) throw new Error(`Error fetching requirements: ${error.message}`);

    return (data || []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      caseId: String(row.case_id),
      documentTypeCode: String(row.document_type_code),
      required: Boolean(row.required),
      status: row.status as RequirementStatus,
      reason: row.reason ? String(row.reason) : null,
      dueDate: row.due_date ? String(row.due_date) : null,
      updatedAt: String(row.updated_at),
    }));
  }

  async updateStatus(caseId: string, userId: string, documentTypeCode: string, status: RequirementStatus): Promise<void> {
    const supabase = await createClient();

    // Check ownership
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (caseError || !caseData) throw new Error("Case not found or unauthorized");

    // Upsert requirement if missing, otherwise update. Since we want to update or insert the status.
    const { error } = await supabase
      .from("case_requirements")
      .upsert({
        case_id: caseId,
        document_type_code: documentTypeCode,
        status: status,
        required: true,
        reason: "Actualizado por el usuario"
      }, { onConflict: 'case_id, document_type_code' });

    if (error) throw new Error(`Error updating requirement: ${error.message}`);
  }
}
