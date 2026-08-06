import { describe, it, expect } from "vitest";
import {
  validateContent,
  hash,
  requireAllowedMimeType,
  requireDocumentPath,
  documentPath,
  parseAllowedMimeType,
} from "./document-storage-rules";
import type { StoreDocumentInput, StoredDocumentObject } from "@/core/storage/document-storage";

describe("document-storage-rules", () => {
  describe("validateContent", () => {
    const validPdfSignature = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x00, 0x00]);
    const validJpegSignature = new Uint8Array([0xff, 0xd8, 0xff, 0x00, 0x00]);
    const validPngSignature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

    const baseInput: StoreDocumentInput = {
      userId: "12345678-1234-1234-1234-123456789012",
      caseId: "12345678-1234-1234-1234-123456789012",
      documentId: "12345678-1234-1234-1234-123456789012",
      filename: "test.pdf",
      mimeType: "application/pdf",
      content: validPdfSignature,
    };

    it("should accept valid PDF document", () => {
      expect(() => validateContent(baseInput)).not.toThrow();
    });

    it("should accept valid JPEG document", () => {
      expect(() =>
        validateContent({ ...baseInput, mimeType: "image/jpeg", content: validJpegSignature }),
      ).not.toThrow();
    });

    it("should accept valid PNG document", () => {
      expect(() =>
        validateContent({ ...baseInput, mimeType: "image/png", content: validPngSignature }),
      ).not.toThrow();
    });

    it("should reject unallowed MIME types", () => {
      expect(() =>
        validateContent({
          ...baseInput,
          // @ts-expect-error Testing invalid MIME type
          mimeType: "text/plain",
        }),
      ).toThrowError("Tipo MIME no permitido.");
    });

    it("should reject empty document", () => {
      expect(() =>
        validateContent({ ...baseInput, content: new Uint8Array(0) }),
      ).toThrowError("El documento está vacío.");
    });

    it("should reject document exceeding max size", () => {
      // Create a dummy length object since we cannot easily allocate 26MB of Uint8Array purely for test speed
      // Wait, we can allocate a 26MB buffer easily.
      const hugeBuffer = new Uint8Array(25 * 1024 * 1024 + 1);
      expect(() =>
        validateContent({ ...baseInput, content: hugeBuffer }),
      ).toThrowError("El documento supera el límite de 25 MB.");
    });

    it("should reject document with invalid signature", () => {
      const invalidPdfSignature = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2e]); // 'PDF.' instead of 'PDF-'
      expect(() =>
        validateContent({ ...baseInput, content: invalidPdfSignature }),
      ).toThrowError("El contenido del documento no coincide con su tipo MIME.");
    });

    it("should reject mismatched signature and mime type", () => {
      expect(() =>
        validateContent({ ...baseInput, mimeType: "image/png", content: validPdfSignature }),
      ).toThrowError("El contenido del documento no coincide con su tipo MIME.");
    });
  });

  describe("hash", () => {
    it("should generate valid sha256 hash", () => {
      const content = new Uint8Array([1, 2, 3]);
      // echo -n -e '\x01\x02\x03' | sha256sum
      // 039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81
      expect(hash(content)).toBe("039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81");
    });
  });

  describe("requireDocumentPath", () => {
    it("should accept valid document paths", () => {
      const validPath =
        "users/12345678-1234-1234-1234-123456789012/cases/12345678-1234-1234-1234-123456789012/documents/12345678-1234-1234-1234-123456789012";
      expect(requireDocumentPath(validPath)).toBe(validPath);
    });

    it("should reject invalid document paths", () => {
      const invalidPath = "users/invalid-uuid/cases/invalid/documents/invalid";
      expect(() => requireDocumentPath(invalidPath)).toThrowError(
        "Ruta de documento no permitida.",
      );
    });

    it("should reject paths containing directory traversal characters", () => {
      const pathWithTraversal =
        "users/12345678-1234-1234-1234-123456789012/cases/12345678-1234-1234-1234-123456789012/documents/12345678-1234-1234-1234-123456789012/../something-else";
      expect(() => requireDocumentPath(pathWithTraversal)).toThrowError(
        "Ruta de documento no permitida.",
      );
    });
  });

  describe("documentPath", () => {
    const baseInput: StoreDocumentInput = {
      userId: "12345678-1234-4234-8234-123456789012",
      caseId: "87654321-4321-4321-8321-210987654321",
      documentId: "11111111-2222-4333-8444-555555555555",
      filename: "test.pdf",
      mimeType: "application/pdf",
      content: new Uint8Array(),
    };

    it("should build path successfully with valid UUIDs", () => {
      const path = documentPath(baseInput);
      expect(path).toBe(
        "users/12345678-1234-4234-8234-123456789012/cases/87654321-4321-4321-8321-210987654321/documents/11111111-2222-4333-8444-555555555555",
      );
    });

    it("should convert uppercase UUIDs to lowercase", () => {
      const path = documentPath({
        ...baseInput,
        userId: "12345678-1234-4234-8234-123456789012".toUpperCase(),
      });
      expect(path).toBe(
        "users/12345678-1234-4234-8234-123456789012/cases/87654321-4321-4321-8321-210987654321/documents/11111111-2222-4333-8444-555555555555",
      );
    });

    it("should throw for invalid userId", () => {
      expect(() => documentPath({ ...baseInput, userId: "invalid" })).toThrowError(
        "userId no es un UUID válido.",
      );
    });

    it("should throw for invalid caseId", () => {
      expect(() => documentPath({ ...baseInput, caseId: "invalid" })).toThrowError(
        "caseId no es un UUID válido.",
      );
    });

    it("should throw for invalid documentId", () => {
      expect(() => documentPath({ ...baseInput, documentId: "invalid" })).toThrowError(
        "documentId no es un UUID válido.",
      );
    });
  });

  describe("requireAllowedMimeType", () => {
    it("should return valid mime type", () => {
      expect(requireAllowedMimeType("application/pdf")).toBe("application/pdf");
      expect(requireAllowedMimeType("image/jpeg")).toBe("image/jpeg");
      expect(requireAllowedMimeType("image/png")).toBe("image/png");
    });

    it("should reject missing mime type", () => {
      expect(() => requireAllowedMimeType(undefined)).toThrowError(
        "El objeto almacenado tiene un tipo MIME no permitido."
      );
    });

    it("should reject invalid mime type", () => {
      expect(() => requireAllowedMimeType("text/plain")).toThrowError(
        "El objeto almacenado tiene un tipo MIME no permitido."
      );
    });
  });

  describe("parseAllowedMimeType", () => {
    it("should return valid mime types", () => {
      expect(parseAllowedMimeType("application/pdf")).toBe("application/pdf");
      expect(parseAllowedMimeType("image/jpeg")).toBe("image/jpeg");
      expect(parseAllowedMimeType("image/png")).toBe("image/png");
    });

    it("should return null for invalid mime types", () => {
      expect(parseAllowedMimeType("text/plain")).toBeNull();
      expect(parseAllowedMimeType("")).toBeNull();
      expect(parseAllowedMimeType("application/json")).toBeNull();
    });
  });
});
