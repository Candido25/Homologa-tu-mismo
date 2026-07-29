@description('Entorno de la plataforma.')
param environment string

@description('Región de los recursos.')
param location string

@description('Nombre corto del proyecto.')
param projectName string

@description('SKU del App Service Plan.')
param appServiceSku string

@description('Crear Azure Database for PostgreSQL Flexible Server.')
param deployPostgres bool

@description('Usuario administrador de PostgreSQL.')
param postgresAdminLogin string

@secure()
@description('Contraseña administrador de PostgreSQL.')
param postgresAdminPassword string

@description('SKU de PostgreSQL Flexible Server.')
param postgresSkuName string

@description('Tier de PostgreSQL Flexible Server.')
param postgresSkuTier string

@description('Almacenamiento PostgreSQL en GiB.')
param postgresStorageGiB int

@description('Permitir conexiones desde otros servicios de Azure al PostgreSQL de desarrollo.')
param postgresAllowAzureServices bool = true

@description('Crear asignaciones RBAC para la identidad administrada de App Service.')
param assignManagedIdentityRoles bool = true

@secure()
@description('Token que protege el endpoint interno de retención documental.')
param documentRetentionJobToken string = ''

@description('Object ID de la identidad federada autorizada para ejecutar operaciones documentales.')
param documentOperationsPrincipalId string = ''

var suffix = take(uniqueString(subscription().subscriptionId, resourceGroup().id, environment), 6)
var normalizedProject = toLower(replace(projectName, '-', ''))
var storageAccountName = take('st${normalizedProject}${environment}${suffix}', 24)
var keyVaultName = take('kv-${projectName}-${environment}-${suffix}', 24)
var webAppName = take('app-${projectName}-${environment}-${suffix}', 60)
var appServicePlanName = 'asp-${projectName}-${environment}'
var logAnalyticsName = 'log-${projectName}-${environment}'
var applicationInsightsName = 'appi-${projectName}-${environment}'
var postgresServerName = take('psql-${projectName}-${environment}-${suffix}', 63)
var databaseName = 'homologa'
var databaseUrlSecretName = 'database-url'
var documentRetentionJobTokenSecretName = 'document-retention-job-token'
var isFreePlan = appServiceSku == 'F1'
var commonTags = {
  application: 'Homologa Tu Mismo'
  environment: environment
  managedBy: 'Bicep'
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: commonTags
  properties: {
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
  sku: {
    name: 'PerGB2018'
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  tags: commonTags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  tags: commonTags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Enabled'
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 30
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 30
    }
  }
}

resource caseDocuments 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'case-documents'
  properties: {
    publicAccess: 'None'
  }
}

resource generatedReports 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'generated-reports'
  properties: {
    publicAccess: 'None'
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: commonTags
  properties: {
    tenantId: tenant().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enablePurgeProtection: environment == 'prod'
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    publicNetworkAccess: 'Enabled'
  }
}

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = if (deployPostgres) {
  name: postgresServerName
  location: location
  tags: commonTags
  sku: {
    name: postgresSkuName
    tier: postgresSkuTier
  }
  properties: {
    version: '16'
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
    authConfig: {
      activeDirectoryAuth: 'Disabled'
      passwordAuth: 'Enabled'
    }
    backup: {
      backupRetentionDays: environment == 'prod' ? 14 : 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    network: {
      publicNetworkAccess: 'Enabled'
    }
    storage: {
      storageSizeGB: postgresStorageGiB
    }
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = if (deployPostgres) {
  parent: postgresServer
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource postgresAzureServicesFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = if (deployPostgres && postgresAllowAzureServices) {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource databaseUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (deployPostgres) {
  parent: keyVault
  name: databaseUrlSecretName
  properties: {
    value: 'postgresql://${postgresAdminLogin}:${postgresAdminPassword}@${postgresServer!.properties.fullyQualifiedDomainName}:5432/${databaseName}?sslmode=require'
  }
}

resource documentRetentionJobTokenSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(documentRetentionJobToken)) {
  parent: keyVault
  name: documentRetentionJobTokenSecretName
  properties: {
    value: documentRetentionJobToken
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  tags: commonTags
  kind: 'linux'
  sku: {
    name: appServiceSku
    tier: isFreePlan ? 'Free' : 'Basic'
    size: appServiceSku
    capacity: 1
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  tags: commonTags
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      alwaysOn: !isFreePlan
      ftpsState: 'Disabled'
      http20Enabled: true
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'NEXT_TELEMETRY_DISABLED'
          value: '1'
        }
        {
          name: 'DOCUMENT_RETENTION_DAYS'
          value: '30'
        }
        {
          name: 'DOCUMENT_RETENTION_JOB_TOKEN'
          value: empty(documentRetentionJobToken)
            ? ''
            : '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=${documentRetentionJobTokenSecretName})'
        }
        {
          name: 'AI_PROVIDER'
          value: 'disabled'
        }
        {
          name: 'STORAGE_PROVIDER'
          value: 'azure-blob'
        }
        {
          name: 'AZURE_STORAGE_ACCOUNT_NAME'
          value: storageAccount.name
        }
        {
          name: 'AZURE_KEY_VAULT_URI'
          value: keyVault.properties.vaultUri
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'DATABASE_PROVIDER'
          value: deployPostgres ? 'postgres' : ''
        }
        {
          name: 'DATABASE_URL'
          value: deployPostgres ? '@Microsoft.KeyVault(SecretUri=${databaseUrlSecret!.properties.secretUri})' : ''
        }
      ]
    }
  }
}

var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
var keyVaultSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'

resource storageBlobRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (assignManagedIdentityRoles) {
  name: guid(storageAccount.id, webApp.id, storageBlobDataContributorRoleId)
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource keyVaultSecretsRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (assignManagedIdentityRoles) {
  name: guid(keyVault.id, webApp.id, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource documentOperationsStorageRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (assignManagedIdentityRoles && !empty(documentOperationsPrincipalId)) {
  name: guid(storageAccount.id, documentOperationsPrincipalId, storageBlobDataContributorRoleId)
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
    principalId: documentOperationsPrincipalId
    principalType: 'ServicePrincipal'
  }
}

resource documentOperationsSecretRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (assignManagedIdentityRoles && !empty(documentRetentionJobToken) && !empty(documentOperationsPrincipalId)) {
  name: guid(documentRetentionJobTokenSecret!.id, documentOperationsPrincipalId, keyVaultSecretsUserRoleId)
  scope: documentRetentionJobTokenSecret
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
    principalId: documentOperationsPrincipalId
    principalType: 'ServicePrincipal'
  }
}

output webAppName string = webApp.name
output webAppDefaultHostname string = webApp.properties.defaultHostName
output storageAccountName string = storageAccount.name
output keyVaultName string = keyVault.name
output applicationInsightsName string = applicationInsights.name
output postgresServerName string = deployPostgres ? postgresServer!.name : ''
output postgresFullyQualifiedDomainName string = deployPostgres ? postgresServer!.properties.fullyQualifiedDomainName : ''
