"use client";

import { useState } from "react";
import type { CaseStage, CaseActivityLog } from "@/core/cases/case-repository";
import { updateCaseStageAction, addCaseLogEntryAction } from "./timeline-actions";

type TimelineClientProps = {
  caseId: string;
  currentStage: CaseStage;
  initialTimeline: CaseActivityLog[];
};

const STAGES: { value: CaseStage; label: string; action: string }[] = [
  { value: "PREPARACION_DOCUMENTAL", label: "1. Preparación Documental", action: "Reúne todos los documentos requeridos." },
  { value: "APOSTILLA_Y_LEGALIZACION", label: "2. Apostilla y Legalización", action: "Apostilla tus documentos en tu país de origen." },
  { value: "PAGO_TASA_790_070", label: "3. Pago de Tasa 790-070", action: "Paga la tasa requerida por el ministerio." },
  { value: "PRESENTACION_SEDE_ELECTRONICA", label: "4. Presentación", action: "Sube tu expediente a la Sede Electrónica." },
  { value: "EN_REVISION_MINISTERIO", label: "5. En Revisión", action: "El Ministerio está revisando tu caso." },
  { value: "SUBSANACION_REQUERIDA", label: "Subsanación", action: "Se requiere documentación adicional." },
  { value: "RESOLUCION_OFICIAL", label: "6. Resolución Oficial", action: "Tu trámite ha finalizado." },
];

export function TimelineClient({ caseId, currentStage, initialTimeline }: TimelineClientProps) {
  const [timeline] = useState<CaseActivityLog[]>(initialTimeline);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newNote, setNewNote] = useState("");

  const currentIndex = STAGES.findIndex((s) => s.value === currentStage);

  async function handleNextStage() {
    if (currentIndex >= STAGES.length - 1) return;
    const nextStage = STAGES[currentIndex + 1];

    setLoading(true);
    setError("");

    const res = await updateCaseStageAction(caseId, nextStage.value);
    if (res.success) {
      // In a real app we'd fetch the timeline again or rely on revalidatePath,
      // but revalidatePath will refresh the page data on next navigation.
      // We will reload the page to get the latest DB state for simplicity and robustness.
      window.location.reload();
    } else {
      setError(res.error || "Error al avanzar etapa");
      setLoading(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    setLoading(true);
    setError("");

    const res = await addCaseLogEntryAction(caseId, "Nota Manual", newNote);
    if (res.success) {
      window.location.reload();
    } else {
      setError(res.error || "Error al guardar la nota");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-ink">Seguimiento del Trámite</h2>
        </div>

        <div className="mb-6 p-4 bg-soft border border-brand/20 rounded">
          <p className="text-sm font-semibold text-brand uppercase tracking-wide mb-1">Etapa Actual</p>
          <p className="text-lg font-bold text-ink">{STAGES[currentIndex]?.label}</p>
          <p className="text-sm text-muted">{STAGES[currentIndex]?.action}</p>

          {currentIndex < STAGES.length - 1 && currentIndex !== 5 && (
            <button
              onClick={handleNextStage}
              disabled={loading}
              className="mt-4 px-4 py-2 bg-brand text-white text-sm font-semibold rounded hover:bg-brand-dark disabled:opacity-50"
            >
              Marcar como completado y avanzar
            </button>
          )}
        </div>

        <div className="relative border-l-2 border-line ml-3 pl-6 space-y-6">
          {timeline.map((log) => (
            <div key={log.id} className="relative">
              <div className="absolute -left-[31px] bg-brand h-3 w-3 rounded-full border-2 border-white"></div>
              <p className="text-sm font-semibold text-ink">{log.title}</p>
              <p className="text-sm text-muted">{log.description}</p>
              <p className="text-xs text-muted/70 mt-1">{new Date(log.createdAt).toLocaleString("es")}</p>
            </div>
          ))}
          {timeline.length === 0 && (
            <p className="text-sm text-muted">Aún no hay actividad registrada.</p>
          )}
        </div>
      </article>

      <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
        <h3 className="font-bold text-ink mb-3">Añadir Nota a la Bitácora</h3>
        <form onSubmit={handleAddNote} className="flex flex-col gap-3">
          <textarea
            className="w-full p-3 border border-line rounded text-sm focus:border-brand focus:outline-none"
            rows={3}
            placeholder="Ej: Documentos enviados por correo, esperando respuesta..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            disabled={loading}
          ></textarea>
          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !newNote.trim()}
            className="self-start px-4 py-2 bg-ink text-white text-sm font-semibold rounded hover:bg-ink/80 disabled:opacity-50"
          >
            Guardar Nota
          </button>
        </form>
      </article>
    </div>
  );
}
