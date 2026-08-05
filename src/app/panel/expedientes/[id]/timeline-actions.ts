"use server";

import { revalidatePath } from "next/cache";
import { getCaseRepository, getCurrentUserProvider } from "@/lib/application-services";
import type { CaseStage, CaseActivityLog } from "@/core/cases/case-repository";

export async function updateCaseStageAction(caseId: string, newStage: CaseStage, note?: string) {
  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return { success: false, error: "No autorizado" };
  }

  try {
    await getCaseRepository().updateStage(caseId, user.id, newStage, note);
    revalidatePath(`/panel/expedientes/${caseId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update case stage", error);
    return { success: false, error: "Ocurrió un error al actualizar la etapa." };
  }
}

export async function addCaseLogEntryAction(caseId: string, title: string, description: string) {
  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return { success: false, error: "No autorizado" };
  }

  try {
    await getCaseRepository().addLogEntry(caseId, user.id, title, description);
    revalidatePath(`/panel/expedientes/${caseId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to add log entry", error);
    return { success: false, error: "Ocurrió un error al agregar la nota." };
  }
}

export async function getCaseTimelineAction(caseId: string): Promise<CaseActivityLog[]> {
  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return [];
  }

  try {
    return await getCaseRepository().getTimeline(caseId, user.id);
  } catch (error) {
    console.error("Failed to fetch timeline", error);
    return [];
  }
}
