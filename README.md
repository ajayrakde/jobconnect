# LokalTalent

This project is a full stack job marketplace built with React and Express. Docker images are built from the included `Dockerfile` and can be deployed to Azure.

## Azure Resources

The app runs best on **Azure Container Apps** or **Azure Web App for Containers**. The required resources are:

- Resource group
- Azure Container Registry (ACR) to store the Docker image
- Log Analytics workspace and Container Apps environment
- Container App (or App Service) that runs the image

A Terraform configuration is provided under `deploy/terraform` to provision these resources.

## Deploying with Terraform

1. Install Terraform and the Azure CLI.
2. Configure credentials (for example, a service connection in Azure DevOps or the `AZURE_CREDENTIALS` secret in GitHub Actions).
3. Run `terraform init` and `terraform apply` inside the `deploy/terraform` directory.
4. Build and push your image using the pipelines under `deploy/azure-app` or `deploy/github-app`.
