import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  DocumentStorage,
  ReadDocumentResult,
  StoreDocumentInput,
  StoredDocumentObject,
} from "@/core/storage/document-storage";
import { documentPath, hash, requireAllowedMimeType, validateContent } from "./document-storage-rules";

export class SupabaseDocumentStorage implements DocumentStorage {
  private readonly bucket = "case-documents";

  async store(input: StoreDocumentInput): Promise<StoredDocumentObject> {
    validateContent(input);
    const supabase = await createClient();
    const path = documentPath(input);

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, input.content, {
        contentType: input.mimeType,
        upsert: false,
      });

    if (error || !data) {
      throw new Error(`Error al subir el archivo a Supabase: ${error?.message || "Error desconocido"}`);
    }

    return {
      provider: "supabase",
      container: this.bucket,
      path: data.path,
      sizeBytes: input.content.byteLength,
      mimeType: input.mimeType,
      sha256: hash(input.content),
    };
  }

  async read(object: StoredDocumentObject): Promise<ReadDocumentResult> {
    if (object.provider !== "supabase") {
      throw new Error(`Proveedor de almacenamiento no soportado: ${object.provider}`);
    }

    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(object.container)
      .download(object.path);

    if (error || !data) {
      throw new Error(`Error al descargar el archivo: ${error?.message || "No encontrado"}`);
    }

    const content = new Uint8Array(await data.arrayBuffer());

    return {
      content,
      mimeType: requireAllowedMimeType(data.type),
      sizeBytes: content.byteLength,
    };
  }

  async delete(object: StoredDocumentObject): Promise<void> {
    if (object.provider !== "supabase") {
      throw new Error(`Proveedor de almacenamiento no soportado: ${object.provider}`);
    }

    const supabase = await createClient();
    const { error } = await supabase.storage
      .from(object.container)
      .remove([object.path]);

    if (error) {
      throw new Error(`Error al eliminar el archivo: ${error.message}`);
    }
  }
}
