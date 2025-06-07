terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "app" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.app.name
  location            = azurerm_resource_group.app.location
  sku                 = "Basic"
  admin_enabled       = true
}

resource "azurerm_log_analytics_workspace" "log" {
  name                = "${var.name_prefix}-log"
  location            = azurerm_resource_group.app.location
  resource_group_name = azurerm_resource_group.app.name
  retention_in_days   = 30
}

resource "azurerm_container_app_environment" "env" {
  name                = "${var.name_prefix}-env"
  location            = azurerm_resource_group.app.location
  resource_group_name = azurerm_resource_group.app.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.log.id
}

resource "azurerm_container_app" "app" {
  name                         = var.container_app_name
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.app.name

  revision_mode = "Single"

  template {
    container {
      name   = "${var.name_prefix}-server"
      image  = "${azurerm_container_registry.acr.login_server}/${var.image_name}:latest"
      cpu    = 0.5
      memory = "1Gi"
      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 5000
  }
}

output "container_app_url" {
  value = azurerm_container_app.app.latest_revision_fqdn
}
