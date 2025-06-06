# JobConnect

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
