"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserProvider, getRequirementRepository } from "@/lib/application-services";
import type { RequirementStatus } from "@/core/cases/requirement-repository";

export async function toggleRequirementStatusAction(caseId: string, documentTypeCode: string, status: RequirementStatus) {
  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return { success: false, error: "Debes iniciar sesión para realizar esta acción." };
  }

  try {
    await getRequirementRepository().updateStatus(caseId, user.id, documentTypeCode, status);
    revalidatePath(`/panel/expedientes/${caseId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update requirement status", error);
    return { success: false, error: "No se pudo actualizar el estado del requisito." };
  }
}
