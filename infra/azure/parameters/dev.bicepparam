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
param enableDocumentRetentionAlerts = false
