# Terraform Deployment

This Terraform configuration provisions the core Azure resources required for the LokalTalent app:

- Resource group
- Azure Container Registry
- Log Analytics workspace
- Container Apps environment
- Container App running the Docker image

## Usage

1. Install the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) and [Terraform](https://developer.hashicorp.com/terraform/downloads).
2. Authenticate with Azure:
   ```bash
   az login
   ```
3. Update the variables in a `terraform.tfvars` file or pass them via the command line. At minimum you must set:
   - `resource_group_name`
   - `acr_name`
   - `container_app_name`
4. Initialize and apply:
   ```bash
   terraform init
   terraform apply
   ```

After deployment, the output will show the Container App URL and ACR login server.

## Pipeline Integration

These files assume you have a service connection or credentials configured in your CI/CD system to run Terraform against your subscription.
