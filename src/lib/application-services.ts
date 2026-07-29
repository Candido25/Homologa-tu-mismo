import "server-only";

import { PostgresCaseRepository } from "@/adapters/cases/postgres-case-repository";
import { SupabaseCaseRepository } from "@/adapters/cases/supabase-case-repository";
import { PostgresDocumentRepository } from "@/adapters/documents/postgres-document-repository";
import { EntraCurrentUserProvider } from "@/adapters/identity/entra-current-user";
import { LocalTestCurrentUserProvider } from "@/adapters/identity/local-test-current-user";
import { SupabaseCurrentUserProvider } from "@/adapters/identity/supabase-current-user";
import { AzureBlobDocumentStorage } from "@/adapters/storage/azure-blob-document-storage";
import { AzuriteDocumentStorage } from "@/adapters/storage/azurite-document-storage";
import type { CaseRepository } from "@/core/cases/case-repository";
import type { CurrentUserProvider } from "@/core/identity/current-user";
import type { DocumentRepository } from "@/core/documents/document-repository";
import type { DocumentStorage } from "@/core/storage/document-storage";
import { DocumentRetentionService } from "@/modules/documents/document-retention-service";
import { DocumentService } from "@/modules/documents/document-service";
import {
  getAuthProviderName,
  getDatabaseProviderName,
  getDocumentRetentionDays,
  getStorageProviderName,
  isAuthProviderConfigured,
  isApplicationDataConfigured,
  isAzureBlobConfigured,
  isAzuriteConfigured,
  isLocalTestAuthEnabled,
  isDocumentUploadUiEnabled,
  isSupabaseConfigured,
} from "@/lib/env";

export function getCurrentUserProvider(): CurrentUserProvider {
  const provider = getAuthProviderName();

  if (provider === "local-test") {
    if (!isLocalTestAuthEnabled()) {
      throw new Error("La identidad ficticia solo puede habilitarse en APP_ENV=local.");
    }
    return new LocalTestCurrentUserProvider();
  }

  if (provider === "supabase") {
    if (!isSupabaseConfigured()) throw new Error("Supabase Auth no está configurado.");
    return new SupabaseCurrentUserProvider();
  }

  if (!isAuthProviderConfigured()) {
    throw new Error("Microsoft Entra External ID no está configurado.");
  }
  return new EntraCurrentUserProvider();
}

export function getCaseRepository(): CaseRepository {
  const provider = getDatabaseProviderName();
  return provider === "postgres" ? new PostgresCaseRepository() : new SupabaseCaseRepository();
}

export function getDocumentStorage(): DocumentStorage {
  const provider = getStorageProviderName();

  if (provider === "azurite") {
    if (!isAzuriteConfigured()) throw new Error("Azurite no está configurado.");
    return new AzuriteDocumentStorage();
  }

  if (provider === "azure-blob") {
    if (!isAzureBlobConfigured()) throw new Error("Azure Blob Storage no está configurado.");
    return new AzureBlobDocumentStorage();
  }

  throw new Error("El adaptador heredado de Supabase Storage no está habilitado.");
}

export function getDocumentRepository(): DocumentRepository {
  if (getDatabaseProviderName() !== "postgres") {
    throw new Error("La persistencia documental portable requiere PostgreSQL.");
  }
  return new PostgresDocumentRepository();
}

export function getDocumentService() {
  return new DocumentService(
    getCaseRepository(),
    getDocumentRepository(),
    getDocumentStorage(),
    getDocumentRetentionDays(),
  );
}

export function getDocumentRetentionService() {
  return new DocumentRetentionService(getDocumentRepository(), getDocumentStorage());
}

export function isPrivateAreaConfigured() {
  return isAuthProviderConfigured() && isApplicationDataConfigured();
}

export function isDocumentFlowConfigured() {
  return isPrivateAreaConfigured() && isDocumentDataConfigured();
}

export function isDocumentDataConfigured() {
  if (getDatabaseProviderName() !== "postgres" || !isApplicationDataConfigured()) return false;

  const storageProvider = getStorageProviderName();
  if (storageProvider === "azurite") return isAzuriteConfigured();
  if (storageProvider === "azure-blob") return isAzureBlobConfigured();
  return false;
}

export function isDocumentInterfaceEnabled() {
  return isDocumentUploadUiEnabled() && isDocumentFlowConfigured();
}
