targetScope = 'subscription'

@description('Entorno a desplegar.')
@allowed([
  'dev'
  'prod'
])
param environment string = 'dev'

@description('Región principal de Azure. Debe declararse explícitamente en el archivo de parámetros del entorno.')
param location string

@description('Nombre corto usado para generar recursos.')
param projectName string = 'homologa'

@description('SKU del App Service Plan. F1 para desarrollo; B1 o superior para producción.')
param appServiceSku string = environment == 'prod' ? 'B1' : 'F1'

@description('Crear Azure Database for PostgreSQL Flexible Server. Mantener false hasta aprobar el gasto del entorno.')
param deployPostgres bool = false

@description('Usuario administrador de PostgreSQL. No debe ser un correo ni contener caracteres especiales.')
param postgresAdminLogin string = 'homologa_admin'

@secure()
@description('Contraseña administrador de PostgreSQL. Solo se requiere cuando deployPostgres=true.')
param postgresAdminPassword string = ''

@description('SKU de PostgreSQL Flexible Server. B_Standard_B1ms es el mínimo propuesto para Azure for Students.')
param postgresSkuName string = 'B_Standard_B1ms'

@description('Tier de PostgreSQL Flexible Server.')
@allowed([
  'Burstable'
  'GeneralPurpose'
  'MemoryOptimized'
])
param postgresSkuTier string = 'Burstable'

@description('Almacenamiento PostgreSQL en GiB. 32 GiB es el mínimo práctico para Flexible Server.')
@minValue(32)
param postgresStorageGiB int = 32

@description('Permitir conexiones desde otros servicios de Azure al PostgreSQL de desarrollo.')
param postgresAllowAzureServices bool = true

@description('Crear asignaciones RBAC para la identidad administrada de App Service. Puede desactivarse en what-if con permisos limitados.')
param assignManagedIdentityRoles bool = true

@secure()
@description('Token que protege el endpoint interno de retención. Omitir hasta desplegar la aplicación.')
param documentRetentionJobToken string = ''

@description('Object ID de la identidad federada que ejecutará operaciones documentales desde GitHub Actions.')
param documentOperationsPrincipalId string = ''

@description('Object ID de la identidad federada que desplegará exclusivamente la aplicación web.')
param applicationDeploymentPrincipalId string = ''

@description('Crear alertas de fallo y ausencia de retención. Activar solo después de la primera ejecución correcta.')
param enableDocumentRetentionAlerts bool = false

@secure()
@description('Correo receptor del grupo de acciones de retención. Obligatorio si se activan alertas.')
param operationsAlertEmail string = ''

var resourceGroupName = 'rg-${projectName}-${environment}'

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: {
    application: 'Homologa Tu Mismo'
    environment: environment
    managedBy: 'Bicep'
  }
}

module platform './modules/platform.bicep' = {
  name: 'platform-${environment}'
  scope: resourceGroup
  params: {
    environment: environment
    location: location
    projectName: projectName
    appServiceSku: appServiceSku
    deployPostgres: deployPostgres
    postgresAdminLogin: postgresAdminLogin
    postgresAdminPassword: postgresAdminPassword
    postgresSkuName: postgresSkuName
    postgresSkuTier: postgresSkuTier
    postgresStorageGiB: postgresStorageGiB
    postgresAllowAzureServices: postgresAllowAzureServices
    assignManagedIdentityRoles: assignManagedIdentityRoles
    documentRetentionJobToken: documentRetentionJobToken
    documentOperationsPrincipalId: documentOperationsPrincipalId
    applicationDeploymentPrincipalId: applicationDeploymentPrincipalId
    enableDocumentRetentionAlerts: enableDocumentRetentionAlerts
    operationsAlertEmail: operationsAlertEmail
  }
}

output resourceGroupName string = resourceGroup.name
output webAppName string = platform.outputs.webAppName
output webAppDefaultHostname string = platform.outputs.webAppDefaultHostname
output storageAccountName string = platform.outputs.storageAccountName
output keyVaultName string = platform.outputs.keyVaultName
output postgresServerName string = platform.outputs.postgresServerName
output postgresFullyQualifiedDomainName string = platform.outputs.postgresFullyQualifiedDomainName
