export const CHECKLIST_VERSION = "checklist-rd-889-2022-v1";

export type ChecklistItem = {
  code: string;
  title: string;
  category: "identity" | "academic" | "legalization" | "administrative" | "review";
  applicable: boolean;
  required: boolean;
  preparation: string;
  complianceModes: string[];
  explanation: string;
};

export type ChecklistInput = {
  procedureType: "homologation" | "equivalence" | "validation" | "professional_recognition" | "undetermined";
  hasOfficialSubmission?: boolean;
};

export function generateChecklist(input: ChecklistInput): { version: string; items: ChecklistItem[] } {
  const base: ChecklistItem[] = [
    {
      code: "identity-document",
      title: "Documento de identidad ficticio",
      category: "identity",
      applicable: true,
      required: true,
      preparation: "Usar solo archivo ficticio hasta apertura comercial.",
      complianceModes: ["copia escaneada ficticia", "dato de prueba redactado"],
      explanation: "Identifica al titular del expediente sin habilitar documentos reales en pruebas.",
    },
    {
      code: "degree-certificate",
      title: "Titulo o diploma ficticio",
      category: "academic",
      applicable: input.procedureType !== "validation",
      required: input.procedureType !== "validation",
      preparation: "Conservar version inmutable, hash y asociacion al expediente.",
      complianceModes: ["PDF ficticio", "imagen ficticia"],
      explanation: "El titulo real permanece cerrado por bandera de seguridad.",
    },
    {
      code: "academic-transcript",
      title: "Certificado academico ficticio",
      category: "academic",
      applicable: true,
      required: true,
      preparation: "Registrar materias, duracion y carga solo con datos artificiales.",
      complianceModes: ["PDF ficticio", "tabla de prueba"],
      explanation: "Permite ensayar preparacion documental sin datos personales reales.",
    },
    {
      code: "apostille-or-legalization",
      title: "Apostilla o legalizacion ficticia",
      category: "legalization",
      applicable: input.procedureType !== "validation",
      required: input.procedureType !== "validation",
      preparation: "Marcar como pendiente de verificacion humana, no certificar autenticidad.",
      complianceModes: ["observacion visual ficticia", "estado pendiente"],
      explanation: "La plataforma no valida autenticidad ni sustituye a la autoridad competente.",
    },
    {
      code: "tasa-107-separate",
      title: "Tasa 107 separada",
      category: "administrative",
      applicable: input.hasOfficialSubmission === true,
      required: input.hasOfficialSubmission === true,
      preparation: "Mantener separada de ingresos de Homologa Tu Mismo.",
      complianceModes: ["referencia informativa versionada"],
      explanation: "La plataforma no paga tasas ni presenta solicitudes.",
    },
    {
      code: "human-review-gate",
      title: "Revision humana bloqueada",
      category: "review",
      applicable: true,
      required: false,
      preparation: "Registrar necesidad de revision, sin asignar especialistas reales.",
      complianceModes: ["doble de prueba", "estado requiere revision"],
      explanation: "Toda decision juridica material queda reservada a revision autorizada.",
    },
  ];

  return { version: CHECKLIST_VERSION, items: base };
}
