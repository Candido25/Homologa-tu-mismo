"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserProvider, getRequirementRepository, getCaseRepository } from "@/lib/application-services";
import type { RequirementStatus } from "@/core/cases/requirement-repository";
import type { CaseStage } from "@/core/cases/case-repository";

// Helper to ensure admin authorization
async function ensureAdmin() {
  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "ADVISOR")) {
    throw new Error("No autorizado. Se requieren permisos de administrador o asesor.");
  }
  return user;
}

export async function adminUpdateRequirementStatus(caseId: string, userId: string, documentTypeCode: string, status: RequirementStatus) {
  await ensureAdmin();

  try {
    // We use the requirement repository. Note that the repository expects a userId to verify ownership.
    // In an admin context, we pass the user ID of the case owner (which the admin has retrieved).
    await getRequirementRepository().updateStatus(caseId, userId, documentTypeCode, status);
    revalidatePath(`/admin/expedientes/${caseId}`);
    return { success: true };
  } catch (error) {
    console.error("Admin failed to update requirement status", error);
    return { success: false, error: "No se pudo actualizar el estado del requisito." };
  }
}

export async function adminUpdateCaseStage(caseId: string, userId: string, newStage: CaseStage, note?: string) {
  const adminUser = await ensureAdmin();

  try {
    // In the domain, the log should probably record the admin's name, but our current
    // repository signature addLogEntry/updateStage is scoped to the case owner's user_id
    // for RLS. We will use the case owner's user_id to satisfy the adapter, and prepend
    // the admin name to the note.
    const adminNote = `[Actualizado por: ${adminUser.displayName || adminUser.email}] ${note || ''}`;

    await getCaseRepository().updateStage(caseId, userId, newStage, adminNote);
    revalidatePath(`/admin/expedientes/${caseId}`);
    return { success: true };
  } catch (error) {
    console.error("Admin failed to update case stage", error);
    return { success: false, error: "No se pudo actualizar la etapa del expediente." };
  }
}
