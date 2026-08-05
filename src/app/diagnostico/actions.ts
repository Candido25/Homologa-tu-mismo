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
    console.error("private_area_not_configured", {
      reason: "isPrivateAreaConfigured returned false, indicating either auth provider or application data is not configured correctly."
    });
    return {
      success: false,
      error: "En este momento no podemos procesar tu solicitud debido a un problema de configuración en nuestros servidores. Por favor, inténtalo más tarde.",
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
