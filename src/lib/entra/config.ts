import "server-only";

import {
  ConfidentialClientApplication,
  LogLevel,
  type Configuration,
} from "@azure/msal-node";
import { getApplicationUrl, isEntraConfigured } from "@/lib/env";

type EntraConfig = {
  tenantId: string;
  tenantSubdomain: string;
  clientId: string;
  clientSecret: string;
  authority: string;
  metadataUrl: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  logoutUrl: string;
  scopes: string[];
  sessionHours: number;
};

declare global {
  var __homologaEntraAuthorityMetadata: Promise<string> | undefined;
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}.`);
  return value;
}

function validSubdomain(value: string) {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(value)) {
    throw new Error("ENTRA_TENANT_SUBDOMAIN no tiene un formato válido.");
  }
  return value.toLowerCase();
}

function sessionHours() {
  const configured = Number.parseInt(process.env.ENTRA_SESSION_HOURS || "", 10);
  if (!Number.isFinite(configured)) return 12;
  return Math.min(Math.max(configured, 1), 24 * 7);
}

export function getEntraConfig(): EntraConfig {
  if (!isEntraConfigured()) {
    throw new Error("Microsoft Entra External ID todavía no está configurado.");
  }

  const tenantSubdomain = validSubdomain(required("ENTRA_TENANT_SUBDOMAIN"));
  const authority = `https://${tenantSubdomain}.ciamlogin.com/`;
  const tenantDomain = `${tenantSubdomain}.onmicrosoft.com`;
  const applicationUrl = new URL(getApplicationUrl());

  return {
    tenantId: required("ENTRA_TENANT_ID"),
    tenantSubdomain,
    clientId: required("ENTRA_CLIENT_ID"),
    clientSecret: required("ENTRA_CLIENT_SECRET"),
    authority,
    metadataUrl: `${authority}${tenantDomain}/v2.0/.well-known/openid-configuration`,
    redirectUri: new URL("/auth/entra/callback", applicationUrl).toString(),
    postLogoutRedirectUri: new URL("/", applicationUrl).toString(),
    logoutUrl: `${authority}${tenantDomain}/oauth2/v2.0/logout`,
    scopes: ["openid", "profile", "email"],
    sessionHours: sessionHours(),
  };
}

async function getAuthorityMetadata(config: EntraConfig) {
  if (!globalThis.__homologaEntraAuthorityMetadata) {
    globalThis.__homologaEntraAuthorityMetadata = fetch(config.metadataUrl, {
      headers: { accept: "application/json" },
      cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`No se pudo cargar la metadata OIDC (${response.status}).`);
      }
      return JSON.stringify(await response.json());
    });
  }

  return globalThis.__homologaEntraAuthorityMetadata;
}

export async function getEntraClient() {
  const config = getEntraConfig();
  const msalConfig: Configuration = {
    auth: {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      authority: config.authority,
      knownAuthorities: [`${config.tenantSubdomain}.ciamlogin.com`],
      authorityMetadata: await getAuthorityMetadata(config),
    },
    system: {
      loggerOptions: {
        piiLoggingEnabled: false,
        logLevel: LogLevel.Warning,
        loggerCallback(_level, message, containsPii) {
          if (!containsPii) console.warn("entra_msal", { message });
        },
      },
    },
  };

  return new ConfidentialClientApplication(msalConfig);
}
