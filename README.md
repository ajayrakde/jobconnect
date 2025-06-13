# LokalTalent

LokalTalent is a full stack job marketplace with a Vite-based React client and Express API. Docker images built from the included Dockerfile can be deployed to Azure.

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd lokaltalent
   ```

2. **Environment Configuration**
   ```bash
   # Copy the environment template
   cp .env.example .env
   
   # Edit with your settings
   nano .env

   # Do NOT commit this file. `.env` is gitignored for security.
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## Environment Configuration

The application uses a `.env` file for configuration. A template file `.env.example` is provided as a reference:

**Important:** Keep your `.env` private and out of version control.

### Required Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/lokaltalent"

# Authentication
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-client-email"
FIREBASE_PRIVATE_KEY="your-private-key"
```

### Optional Features

#### Caching (Optional)
```env
# Master switch for caching
CACHE_ENABLED=false

# Individual feature toggles
CACHE_CANDIDATES_ENABLED=false
CACHE_EMPLOYERS_ENABLED=false
CACHE_JOBS_ENABLED=false

# Performance thresholds
CACHE_MIN_RECORDS=1000  # Start caching when records exceed this number
```

#### Redis (Required if caching is enabled)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

### Why .env.example?

We maintain an `.env.example` file for several reasons:
1. **Security**: Real credentials in `.env` should never be committed to git
2. **Documentation**: Shows what environment variables are needed
3. **Onboarding**: New developers can quickly set up their environment
4. **Version Control**: Track required configuration changes

Always update `.env.example` when adding new environment variables!

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

## Build

```bash
npm run build
```


The command bundles the server and produces `dist/index.js` which can be deployed.

## Schema Workflow

The canonical database schema lives in `shared/schema.ts`. `drizzle-kit` reads
from this file when generating migrations. Any changes to the database should be
made here.

1. Update `shared/schema.ts` with your table or column changes.
2. Run `npx drizzle-kit generate` to create a new migration under `migrations/`.
3. Apply the migration to your database.
4. Commit the updated migration along with the schema file.

The TypeScript files inside `drizzle/schema/` are kept only for reference and are
not used by the migration tooling.
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
