"use client";

import { type FormEvent, useMemo, useRef, useState, useEffect } from "react";
import type {
  DocumentSummary,
  DocumentType,
} from "@/core/documents/document-repository";
import { uploadCaseDocument, deleteCaseDocument, getCaseDocuments } from "./actions";

type DocumentManagerProps = {
  caseId: string;
  documentTypes: DocumentType[];
  initialDocuments: DocumentSummary[];
  onChange?: (documents: DocumentSummary[]) => void;
};

function formatSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function fileKind(mimeType: DocumentSummary["mimeType"]) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "image/png") return "PNG";
  return "JPG";
}

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export function DocumentManager({
  caseId,
  documentTypes,
  initialDocuments,
  onChange,
}: DocumentManagerProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [documentTypeCode, setDocumentTypeCode] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Notify parent of changes to documents list
  useEffect(() => {
    if (onChange) {
      onChange(documents);
    }
  }, [documents, onChange]);

  const sortedDocuments = useMemo(
    () =>
      [...documents].sort((left, right) =>
        right.uploadedAt > left.uploadedAt
          ? 1
          : right.uploadedAt < left.uploadedAt
            ? -1
            : 0,
      ),
    [documents],
  );

  const latestByType = useMemo(() => {
    const latest = new Map<string, DocumentSummary>();
    for (const document of sortedDocuments) {
      if (!latest.has(document.documentTypeCode)) {
        latest.set(document.documentTypeCode, document);
      }
    }
    return latest;
  }, [sortedDocuments]);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setError("");
    setMessage("");

    if (file) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setError("Solo se permiten archivos PDF, JPEG o PNG.");
        setSelectedFile(null);
        event.target.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("El archivo supera el límite de 25 MB.");
        setSelectedFile(null);
        event.target.value = "";
        return;
      }
    }
    setSelectedFile(file);
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile || !documentTypeCode) {
      setError("Selecciona el tipo documental y el archivo que deseas cargar.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    const body = new FormData();
    body.set("tipoDocumento", documentTypeCode);
    body.set("archivo", selectedFile);

    try {
      const response = await uploadCaseDocument(caseId, body);

      if (!response.success) {
        if (response.code === "unauthenticated") {
          window.location.assign(`/iniciar-sesion?siguiente=${encodeURIComponent(`/panel/expedientes/${caseId}`)}`);
          return;
        }
        throw new Error(response.error);
      }

      const latestDocuments = await getCaseDocuments(caseId);
      setDocuments(latestDocuments);
      setSelectedFile(null);
      setDocumentTypeCode("");
      setMessage(`${response.document.documentTypeName} se guardó correctamente.`);
      formRef.current?.reset();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "No pudimos cargar el documento.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(document: DocumentSummary) {
    setDeletingId(document.id);
    setError("");
    setMessage("");

    try {
      const response = await deleteCaseDocument(caseId, document.id);

      if (!response.success) {
        if (response.code === "unauthenticated") {
          window.location.assign(`/iniciar-sesion?siguiente=${encodeURIComponent(`/panel/expedientes/${caseId}`)}`);
          return;
        }
        throw new Error(response.error);
      }

      const latestDocuments = await getCaseDocuments(caseId);
      setDocuments(latestDocuments);
      setConfirmDeleteId(null);
      setMessage(`${document.originalFilename} se eliminó del expediente.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "No pudimos eliminar el documento.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <article className="bg-surface p-6 rounded-lg shadow-sm border border-line">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <span className="bg-soft text-ink px-3 py-1 rounded text-sm font-semibold border border-line inline-block mb-2">Preparación documental</span>
          <h2 className="text-xl font-bold text-ink mb-1">Archivos del expediente</h2>
          <p className="text-muted text-sm">
            Organiza versiones de tus documentos. Los archivos se mantienen privados y se asocian de forma segura a tu sesión.
          </p>
        </div>
        <div className="bg-soft border border-line rounded px-4 py-2 text-center min-w-[100px]">
          <strong className="block text-2xl text-ink leading-tight">{documents.length}</strong>
          <span className="text-muted text-xs uppercase font-bold tracking-wide">{documents.length === 1 ? "archivo" : "archivos"}</span>
        </div>
      </div>

      <form className="bg-soft border border-line rounded-lg p-5 mb-6" onSubmit={uploadDocument} ref={formRef}>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <label className="flex-1">
            <span className="block font-semibold text-sm mb-1 text-ink">Tipo documental</span>
            <select
              className="w-full p-2 border border-line rounded focus:outline-none focus:border-brand bg-white disabled:opacity-50 transition-colors"
              value={documentTypeCode}
              onChange={(event) => setDocumentTypeCode(event.target.value)}
              disabled={uploading}
            >
              <option value="" disabled>Selecciona un tipo</option>
              {documentTypes.map((documentType) => (
                <option key={documentType.code} value={documentType.code}>
                  {documentType.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex-1">
            <span className="block font-semibold text-sm mb-1 text-ink">Archivo (Max 25MB)</span>
            <input
              className="w-full p-1.5 border border-line rounded bg-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-dark transition-colors disabled:opacity-50 cursor-pointer text-sm"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <p className="text-sm font-medium text-muted truncate pr-4">
            {selectedFile
              ? `${selectedFile.name} | ${formatSize(selectedFile.size)}`
              : "Formatos: PDF, JPG, PNG."}
          </p>
          <button
            className="px-5 py-2 bg-brand text-white font-semibold rounded hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
            type="submit"
            disabled={uploading || !selectedFile || !documentTypeCode}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando...
              </span>
            ) : "Cargar archivo"}
          </button>
        </div>
      </form>

      <div aria-live="polite" className="mb-6">
        {error ? (
          <p className="p-3 bg-red-50 text-danger border border-red-200 rounded text-sm font-medium">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="p-3 bg-green-50 text-brand-dark border border-green-200 rounded text-sm font-medium">
            {message}
          </p>
        ) : null}
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-ink mb-3 text-lg border-b border-line pb-2">Estado por tipo documental</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentTypes.map((documentType) => {
            const latest = latestByType.get(documentType.code);
            return (
              <div
                className={`p-3 rounded border flex justify-between items-center ${latest ? "bg-white border-line" : "bg-soft border-dashed border-line text-muted"}`}
                key={documentType.code}
              >
                <div className="flex flex-col overflow-hidden pr-2">
                  <strong className="text-sm truncate">{documentType.name}</strong>
                  <span className="text-xs truncate">
                    {latest ? `${latest.originalFilename} (v${latest.version})` : "Falta cargar"}
                  </span>
                </div>
                {latest ? (
                  <span className="inline-block w-2 h-2 bg-brand rounded-full flex-shrink-0" title="Disponible"></span>
                ) : (
                  <span className="inline-block w-2 h-2 bg-line rounded-full flex-shrink-0" title="Pendiente"></span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between border-b border-line pb-2 mb-4">
          <h3 className="font-bold text-ink text-lg">Versiones cargadas</h3>
          <span className="text-sm font-semibold text-muted bg-soft px-2 py-0.5 rounded">{documents.length} total</span>
        </div>

        {sortedDocuments.length > 0 ? (
          <ul className="space-y-3">
            {sortedDocuments.map((document) => (
              <li className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-line rounded hover:shadow-sm transition-shadow gap-4" key={document.id}>
                <div className="flex gap-4 items-center overflow-hidden w-full">
                  <span className="bg-brand text-white font-bold text-xs uppercase px-2 py-1 rounded select-none flex-shrink-0 w-12 text-center" aria-hidden="true">
                    {fileKind(document.mimeType)}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <strong className="text-sm text-ink truncate block" title={document.originalFilename}>{document.originalFilename}</strong>
                    <span className="text-xs text-muted block truncate">
                      {document.documentTypeName} · v{document.version} · {formatSize(document.sizeBytes)} · {formatDate(document.uploadedAt)}
                    </span>
                    <small className="text-[10px] text-muted block mt-0.5">
                      {document.retentionUntil
                        ? `Se conserva hasta ${formatDate(document.retentionUntil)}`
                        : "Sin vencimiento configurado"}
                    </small>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end border-t sm:border-0 pt-3 sm:pt-0 border-line">
                  <a
                    className="text-brand hover:text-brand-dark text-sm font-semibold transition"
                    href={`/api/expedientes/${caseId}/documentos/${document.id}`}
                  >
                    Descargar
                  </a>
                  <span className="text-line mx-1">|</span>
                  {confirmDeleteId === document.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        className="text-danger font-semibold text-sm hover:underline disabled:opacity-50"
                        type="button"
                        onClick={() => deleteDocument(document)}
                        disabled={deletingId === document.id}
                      >
                        {deletingId === document.id ? "Eliminando..." : "Confirmar"}
                      </button>
                      <button
                        className="text-muted text-sm hover:underline disabled:opacity-50"
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={deletingId === document.id}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      className="text-muted hover:text-danger text-sm font-semibold transition"
                      type="button"
                      onClick={() => setConfirmDeleteId(document.id)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12 px-4 bg-soft border border-dashed border-line rounded">
            <strong className="block text-ink text-lg mb-2">Aún no hay archivos cargados</strong>
            <p className="text-muted text-sm max-w-md mx-auto">
              Elige un tipo documental arriba y añade el primer archivo a tu expediente de forma segura.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
