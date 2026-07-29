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
  }
}

output resourceGroupName string = resourceGroup.name
output webAppName string = platform.outputs.webAppName
output webAppDefaultHostname string = platform.outputs.webAppDefaultHostname
output storageAccountName string = platform.outputs.storageAccountName
output keyVaultName string = platform.outputs.keyVaultName
