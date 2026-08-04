"use server";

import { revalidatePath } from "next/cache";
import {
  getCaseRepository,
  getCurrentUserProvider,
  isPrivateAreaConfigured,
} from "@/lib/application-services";
import {
  countryCodeForDatabase,
  evaluateDiagnostic,
  objectiveForDatabase,
  parseDiagnosticInput,
} from "@/modules/diagnostics/evaluate";

export type SaveDiagnosticResponse =
  | { success: true; caseId: string }
  | { success: false; error: string; code?: "unauthenticated" | "invalid_input" | "not_configured" };

export async function saveDiagnosticCase(payload: unknown): Promise<SaveDiagnosticResponse> {
  if (!isPrivateAreaConfigured()) {
    return {
      success: false,
      error: "La identidad o la base de datos todavía no están configuradas.",
      code: "not_configured"
    };
  }

  const parsed = parseDiagnosticInput(payload);
  if (!parsed.ok) {
    return { success: false, error: parsed.error, code: "invalid_input" };
  }

  const user = await getCurrentUserProvider().getCurrentUser();
  if (!user) {
    return { success: false, error: "Debes iniciar sesión para guardar el expediente.", code: "unauthenticated" };
  }

  const result = evaluateDiagnostic(parsed.input);
  const title = `${result.route}: ${parsed.input.degree}`.slice(0, 180);
  const diagnosticPayload = {
    input: parsed.input,
    result,
    savedAt: new Date().toISOString(),
    disclaimer: "Resultado preliminar y no vinculante.",
  };

  try {
    const data = await getCaseRepository().create({
      userId: user.id,
      title,
      originCountryCode: countryCodeForDatabase(parsed.input.country),
      degreeName: parsed.input.degree,
      objective: objectiveForDatabase(parsed.input.objective),
      procedureType: result.procedureType,
      diagnosticVersion: result.version,
      diagnosticPayload,
    });

    revalidatePath("/panel");
    return { success: true, caseId: data.id };
  } catch (error) {
    console.error("case_create_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { success: false, error: "No pudimos crear el expediente. Comprueba tu conexión." };
  }
}
