# LokalTalent

This project is a full stack job marketplace built with React and Express. Docker images are built from the included `Dockerfile` and can be deployed to Azure.

## Azure Resources

The app runs best on **Azure Container Apps** or **Azure Web App for Containers**. The required resources are:

- Resource group
- Azure Container Registry (ACR) to store the Docker image
- Log Analytics workspace and Container Apps environment
- Container App (or App Service) that runs the image
- Optional custom domain and SSL certificate

A Terraform configuration is provided under `deploy/terraform` to provision these resources.

## Deploying with Terraform

1. Install Terraform and the Azure CLI.
2. Configure credentials (for example, a service connection in Azure DevOps or the `AZURE_CREDENTIALS` secret in GitHub Actions).
3. Run `terraform init` and `terraform apply` inside the `deploy/terraform` directory.
4. Build and push your image using the pipelines under `deploy/azure-app` or `deploy/github-app`.

To configure a custom domain, set `custom_domain_name` and certificate variables in `terraform.tfvars` before applying.

# LokalTalent

This project contains a Vite-based client and an Express API.

## Build

```bash
npm run build
```

The command bundles the server and produces `dist/index.js` which can be deployed.

## Deploying to Azure Functions

1. Install the Azure Functions Core Tools.
2. After building, create a function that uses the `azure-function-express` adapter:

```javascript
// api/index.js
const { createHandler } = require('azure-function-express');
const app = require('../dist/index.js');

module.exports = createHandler(app);
```

3. Publish the function:

```bash
func azure functionapp publish <YOUR_APP_NAME>
```

This uploads the compiled Express app and exposes its routes via Azure Functions.

## Production Environment Variables

Configure these variables in the Function App settings (or `local.settings.json` when running locally):

- `DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

They are required for the server to start correctly.
