"use client";

import { useState } from "react";
import type { CaseStage, CaseActivityLog } from "@/core/cases/case-repository";
import { adminUpdateCaseStage } from "./admin-actions";

type AdminTimelineManagerProps = {
  caseId: string;
  userId: string;
  currentStage: CaseStage;
  timeline: CaseActivityLog[];
};

const STAGES: { value: CaseStage; label: string }[] = [
  { value: "PREPARACION_DOCUMENTAL", label: "Preparación Documental" },
  { value: "APOSTILLA_Y_LEGALIZACION", label: "Apostilla y Legalización" },
  { value: "PAGO_TASA_790_070", label: "Pago de Tasa" },
  { value: "PRESENTACION_SEDE_ELECTRONICA", label: "Presentación Sede Electrónica" },
  { value: "EN_REVISION_MINISTERIO", label: "En Revisión Ministerio" },
  { value: "SUBSANACION_REQUERIDA", label: "Subsanación Requerida" },
  { value: "RESOLUCION_OFICIAL", label: "Resolución Oficial" },
];

export function AdminTimelineManager({ caseId, userId, currentStage, timeline }: AdminTimelineManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStage, setSelectedStage] = useState<CaseStage>(currentStage);
  const [note, setNote] = useState("");

  async function handleUpdateStage(e: React.FormEvent) {
    e.preventDefault();
    if (selectedStage === currentStage && !note.trim()) {
      setError("Cambia la etapa o añade una nota para actualizar.");
      return;
    }

    setLoading(true);
    setError("");

    const response = await adminUpdateCaseStage(caseId, userId, selectedStage, note);
    if (!response.success) {
      setError(response.error || "No se pudo actualizar la bitácora.");
    } else {
      setNote(""); // Clear note on success
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="bg-soft border border-line rounded-lg p-4">
        <h3 className="font-bold text-ink mb-4">Actualizar Etapa Oficial</h3>
        <form onSubmit={handleUpdateStage} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Mover expediente a:</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value as CaseStage)}
              className="w-full p-2 border border-line rounded bg-white focus:outline-none focus:border-brand"
              disabled={loading}
            >
              {STAGES.map(stage => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Nota visible para el usuario (opcional):</label>
            <textarea
              className="w-full p-2 border border-line rounded bg-white focus:outline-none focus:border-brand"
              rows={3}
              placeholder="Ej: Se ha revisado la documentación y se procede a la presentación."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <p className="text-danger text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading || (selectedStage === currentStage && !note.trim())}
            className="px-4 py-2 bg-ink text-white font-semibold rounded hover:bg-ink/80 disabled:opacity-50 transition"
          >
            {loading ? "Actualizando..." : "Actualizar Bitácora"}
          </button>
        </form>
      </div>

      <div>
        <h3 className="font-bold text-ink mb-3 border-b border-line pb-2">Historial Reciente</h3>
        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
          {timeline.length === 0 ? (
            <p className="text-muted text-sm text-center py-4">No hay registros en la bitácora.</p>
          ) : (
            timeline.map(log => (
              <div key={log.id} className="bg-white border border-line rounded p-3 text-sm">
                <div className="flex justify-between items-start mb-1">
                  <strong className="text-ink">{log.title}</strong>
                  <span className="text-muted text-xs">{new Date(log.createdAt).toLocaleString("es")}</span>
                </div>
                <p className="text-muted">{log.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
