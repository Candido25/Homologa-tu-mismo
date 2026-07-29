import "server-only";

import type {
  CreateDocumentRecordInput,
  DocumentRecord,
  DocumentRepository,
  DocumentStatus,
  DocumentSummary,
  DocumentType,
} from "@/core/documents/document-repository";
import type { StoredDocumentObject } from "@/core/storage/document-storage";
import { query, withTransaction } from "@/lib/postgres/pool";

type DocumentRow = {
  id: string;
  case_id: string;
  user_id: string;
  document_type_code: string;
  document_type_name: string;
  storage_provider: string;
  storage_container: string;
  storage_path: string;
  original_filename: string;
  mime_type: StoredDocumentObject["mimeType"];
  size_bytes: string | number;
  sha256: string | null;
  status: DocumentStatus;
  version: number;
  retention_until: Date | string | null;
  uploaded_at: Date | string;
};

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function optionalIso(value: Date | string | null) {
  return value ? iso(value) : null;
}

function mapSummary(row: DocumentRow): DocumentSummary {
  return {
    id: row.id,
    caseId: row.case_id,
    documentTypeCode: row.document_type_code,
    documentTypeName: row.document_type_name,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    status: row.status,
    version: row.version,
    retentionUntil: optionalIso(row.retention_until),
    uploadedAt: iso(row.uploaded_at),
  };
}

function mapRecord(row: DocumentRow): DocumentRecord {
  return {
    ...mapSummary(row),
    userId: row.user_id,
    storage: {
      provider: row.storage_provider,
      container: row.storage_container,
      path: row.storage_path,
      sizeBytes: Number(row.size_bytes),
      mimeType: row.mime_type,
      sha256: row.sha256 || "",
    },
  };
}

const documentSelect = [
  "select d.id, d.case_id, d.user_id, d.document_type_code,",
  "dt.name_es as document_type_name, d.storage_provider, d.storage_container,",
  "d.storage_path, d.original_filename, d.mime_type, d.size_bytes, d.sha256,",
  "d.status, d.version, d.retention_until, d.uploaded_at",
  "from documents d",
  "join document_types dt on dt.code = d.document_type_code",
].join(" ");

export class PostgresDocumentRepository implements DocumentRepository {
  async getActiveDocumentType(code: string): Promise<DocumentType | null> {
    const result = await query<{
      code: string;
      name_es: string;
      sensitivity: DocumentType["sensitivity"];
    }>(
      [
        "select code, name_es, sensitivity",
        "from document_types",
        "where code = $1 and active = true",
        "limit 1",
      ].join(" "),
      [code],
    );

    const row = result.rows[0];
    return row ? { code: row.code, name: row.name_es, sensitivity: row.sensitivity } : null;
  }

  async listByCaseForUser(caseId: string, userId: string): Promise<DocumentSummary[]> {
    const result = await query<DocumentRow>(
      [
        documentSelect,
        "where d.case_id = $1 and d.user_id = $2 and d.status <> 'deleted'",
        "order by dt.name_es, d.version desc, d.uploaded_at desc",
      ].join(" "),
      [caseId, userId],
    );

    return result.rows.map(mapSummary);
  }

  async getByIdForUser(
    documentId: string,
    caseId: string,
    userId: string,
  ): Promise<DocumentRecord | null> {
    const result = await query<DocumentRow>(
      [
        documentSelect,
        "where d.id = $1 and d.case_id = $2 and d.user_id = $3 and d.status <> 'deleted'",
        "limit 1",
      ].join(" "),
      [documentId, caseId, userId],
    );

    return result.rows[0] ? mapRecord(result.rows[0]) : null;
  }

  async create(input: CreateDocumentRecordInput): Promise<DocumentSummary> {
    return withTransaction(async (client) => {
      await client.query("select pg_advisory_xact_lock(hashtext($1), hashtext($2))", [
        input.caseId,
        input.documentType.code,
      ]);

      const versionResult = await client.query<{ version: number }>(
        [
          "select coalesce(max(version), 0)::integer + 1 as version",
          "from documents",
          "where case_id = $1 and document_type_code = $2",
        ].join(" "),
        [input.caseId, input.documentType.code],
      );
      const version = versionResult.rows[0].version;

      const result = await client.query<DocumentRow>(
        [
          "insert into documents (",
          "id, case_id, user_id, document_type_code, storage_provider, storage_container,",
          "storage_path, original_filename, mime_type, size_bytes, sha256, version, retention_until",
          ") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
          "returning id, case_id, user_id, document_type_code,",
          "$14::text as document_type_name, storage_provider, storage_container, storage_path,",
          "original_filename, mime_type, size_bytes, sha256, status, version, retention_until, uploaded_at",
        ].join(" "),
        [
          input.id,
          input.caseId,
          input.userId,
          input.documentType.code,
          input.storage.provider,
          input.storage.container,
          input.storage.path,
          input.originalFilename,
          input.storage.mimeType,
          input.storage.sizeBytes,
          input.storage.sha256,
          version,
          input.retentionUntil,
          input.documentType.name,
        ],
      );

      await client.query(
        [
          "insert into case_requirements (case_id, document_type_code, required, status, reason)",
          "values ($1, $2, true, 'uploaded', 'Documento cargado por el usuario.')",
          "on conflict (case_id, document_type_code) do update",
          "set status = 'uploaded', updated_at = now()",
        ].join(" "),
        [input.caseId, input.documentType.code],
      );

      return mapSummary(result.rows[0]);
    });
  }

  async markDeleted(documentId: string, caseId: string, userId: string): Promise<boolean> {
    return withTransaction(async (client) => {
      const result = await client.query<{ document_type_code: string }>(
        [
          "update documents",
          "set status = 'deleted', deleted_at = now(), updated_at = now()",
          "where id = $1 and case_id = $2 and user_id = $3 and status <> 'deleted'",
          "returning document_type_code",
        ].join(" "),
        [documentId, caseId, userId],
      );

      const documentTypeCode = result.rows[0]?.document_type_code;
      if (!documentTypeCode) return false;

      await client.query(
        [
          "update case_requirements r",
          "set status = case when exists (",
          "select 1 from documents d",
          "where d.case_id = r.case_id",
          "and d.document_type_code = r.document_type_code",
          "and d.status <> 'deleted'",
          ") then 'uploaded' else 'missing' end,",
          "updated_at = now()",
          "where r.case_id = $1 and r.document_type_code = $2",
        ].join(" "),
        [caseId, documentTypeCode],
      );

      return true;
    });
  }
}
