using '../main.bicep'

param environment = 'dev'
param location = 'chilecentral'
param projectName = 'homologa'
param appServiceSku = 'F1'
param deployPostgres = false
param postgresSkuName = 'B_Standard_B1ms'
param postgresSkuTier = 'Burstable'
param postgresStorageGiB = 32
param postgresAllowAzureServices = true
param assignManagedIdentityRoles = true
param databaseMigrationPrincipalId = 'fb2026ee-63d1-443d-880d-2d62b547c7f9'
param entraTenantId = 'dd9ae613-fadb-40ea-b39d-90f558d10290'
param entraTenantSubdomain = 'homologatumismo'
param entraClientId = '13041d58-48a1-4b6d-82c2-1297bf1e8bd7'
param enableDocumentRetentionAlerts = false
