"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import type {
  DocumentSummary,
  DocumentType,
} from "@/core/documents/document-repository";

type DocumentManagerProps = {
  caseId: string;
  documentTypes: DocumentType[];
  initialDocuments: DocumentSummary[];
};

type UploadResponse = {
  document?: DocumentSummary;
  error?: string;
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

export function DocumentManager({
  caseId,
  documentTypes,
  initialDocuments,
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

  const sortedDocuments = useMemo(
    () =>
      [...documents].sort(
        (left, right) =>
          new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime(),
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
      const response = await fetch(`/api/expedientes/${caseId}/documentos`, {
        method: "POST",
        body,
      });
      const data = (await response.json()) as UploadResponse;
      if (!response.ok || !data.document) {
        throw new Error(data.error || "No pudimos cargar el documento.");
      }

      setDocuments((current) => [data.document!, ...current]);
      setSelectedFile(null);
      setDocumentTypeCode("");
      setMessage(`${data.document.documentTypeName} se guardó correctamente.`);
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
      const response = await fetch(
        `/api/expedientes/${caseId}/documentos/${document.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const data = (await response.json()) as UploadResponse;
        throw new Error(data.error || "No pudimos eliminar el documento.");
      }

      setDocuments((current) => current.filter((item) => item.id !== document.id));
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
    <article className="detail-card document-manager">
      <div className="document-manager-heading">
        <div>
          <span className="result-label">Preparación documental</span>
          <h2>Archivos del expediente</h2>
          <p>
            Organiza versiones ficticias por tipo documental. Los archivos se mantienen privados y
            se descargan únicamente desde tu sesión.
          </p>
        </div>
        <div className="document-count" aria-label={`${documents.length} documentos cargados`}>
          <strong>{documents.length}</strong>
          <span>{documents.length === 1 ? "archivo" : "archivos"}</span>
        </div>
      </div>

      <form className="document-upload-form" onSubmit={uploadDocument} ref={formRef}>
        <div className="document-upload-fields">
          <label>
            <span>Tipo documental</span>
            <select
              value={documentTypeCode}
              onChange={(event) => setDocumentTypeCode(event.target.value)}
              disabled={uploading}
            >
              <option value="" disabled>
                Selecciona un tipo
              </option>
              {documentTypes.map((documentType) => (
                <option key={documentType.code} value={documentType.code}>
                  {documentType.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Archivo</span>
            <input
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              disabled={uploading}
            />
          </label>
        </div>

        <div className="document-upload-footer">
          <p>
            {selectedFile
              ? `${selectedFile.name} | ${formatSize(selectedFile.size)}`
              : "PDF, JPG o PNG. Máximo 25 MB."}
          </p>
          <button
            className="button"
            type="submit"
            disabled={uploading || !selectedFile || !documentTypeCode}
          >
            {uploading ? "Cargando..." : "Cargar archivo"}
          </button>
        </div>
      </form>

      <div className="document-feedback" aria-live="polite">
        {error ? (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="notice notice-success" role="status">
            {message}
          </p>
        ) : null}
      </div>

      <div className="document-type-grid" aria-label="Estado por tipo documental">
        {documentTypes.map((documentType) => {
          const latest = latestByType.get(documentType.code);
          return (
            <div
              className={`document-type-row${latest ? " is-ready" : ""}`}
              key={documentType.code}
            >
              <div>
                <strong>{documentType.name}</strong>
                <span>
                  {latest
                    ? `${latest.originalFilename} | Versión ${latest.version}`
                    : "Sin archivo cargado"}
                </span>
              </div>
              <small>{latest ? "Disponible" : "Pendiente"}</small>
            </div>
          );
        })}
      </div>

      <div className="document-records-heading">
        <h3>Versiones cargadas</h3>
        <span>{documents.length} en total</span>
      </div>

      {sortedDocuments.length > 0 ? (
        <ul className="document-record-list">
          {sortedDocuments.map((document) => (
            <li className="document-record" key={document.id}>
              <span className="document-file-kind" aria-hidden="true">
                {fileKind(document.mimeType)}
              </span>
              <div className="document-record-copy">
                <strong>{document.originalFilename}</strong>
                <span>
                  {document.documentTypeName} | Versión {document.version} |{" "}
                  {formatSize(document.sizeBytes)} | {formatDate(document.uploadedAt)}
                </span>
              </div>
              <div className="document-record-actions">
                <a
                  className="document-action"
                  href={`/api/expedientes/${caseId}/documentos/${document.id}`}
                >
                  Descargar
                </a>
                {confirmDeleteId === document.id ? (
                  <>
                    <button
                      className="document-action document-action-danger"
                      type="button"
                      onClick={() => deleteDocument(document)}
                      disabled={deletingId === document.id}
                    >
                      {deletingId === document.id ? "Eliminando..." : "Confirmar"}
                    </button>
                    <button
                      className="document-action"
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deletingId === document.id}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    className="document-action document-action-danger"
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
        <div className="document-empty-state">
          <strong>Aún no hay archivos cargados</strong>
          <p>Elige un tipo documental y añade el primer archivo ficticio del expediente.</p>
        </div>
      )}
    </article>
  );
}
