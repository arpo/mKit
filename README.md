# TypeScript Boilerplate

## Prerequisites
- Node.js and npm installed on your system

## Setup
1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Development
The project uses TypeScript for both frontend and server-side development, with the following structure:
- Frontend TypeScript source files are in `src/ts/`
- Server TypeScript source file is in `src/server.ts`
- Compiled JavaScript files output to `public/js/`

To start development with hot-reloading:
```bash
npm run dev
```

This command will:
- Start the Node.js server with automatic reloading
- Launch browser-sync for live reloading
- Watch and compile TypeScript files automatically

## Available Scripts
- `npm run dev` - Start development environment with hot-reloading
- `npm run server` - Start the Node.js server only
- `npm run client` - Start browser-sync only
- `npm run ts:watch` - Watch and compile TypeScript files
- `npm run lint` - Run ESLint to check code quality

## Project Structure
```
├── public/              # Static files served to client
│   ├── css/            # CSS styles
│   ├── js/             # Compiled JavaScript
│   └── index.html      # Main HTML file
├── src/
│   ├── ts/             # Frontend TypeScript source files
│   └── server.ts       # TypeScript server
├── tsconfig.json       # TypeScript configuration for frontend
├── tsconfig.server.json # TypeScript configuration for server
├── eslint.config.js    # ESLint configuration
├── browser-sync.config.cjs # Browser-sync configuration
├── nodemon.json        # Nodemon configuration for server auto-reload
└── package.json        # Project dependencies and scripts
```

## Code Quality
The project includes ESLint for maintaining code quality and consistency. Run the linting check with:
```bash
npm run lint
```

## Deployment to Google Cloud Run

This project includes an interactive script to help automate deployment to Google Cloud Run.

**Prerequisites:**

*   Ensure you have the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed (`gcloud` CLI).
*   Authenticate the `gcloud` CLI with your user account which has permissions to enable APIs, create service accounts, and manage IAM roles in your target GCP project:
    ```bash
    gcloud auth login
    ```
*   Have your GCP Project ID ready.

**Usage:**

1.  Run the interactive deployment script:
    ```bash
    npm run deploy:gcp
    ```
2.  The script will prompt you for necessary details like:
    *   GCP Project ID
    *   Deployment Region (e.g., `us-central1`)
    *   Cloud Run Service Name
    *   Artifact Registry Repository Name
    *   Docker Image Name
    *   Deployer Service Account Name (will be created)
    *   Runtime Service Account Email (defaults to Compute Engine default SA)
3.  Follow the script's prompts. It will guide you through:
    *   Enabling necessary GCP APIs (requires user authentication).
    *   Creating the Artifact Registry repository (requires user authentication).
    *   Creating a dedicated Deployer Service Account and key file (requires user authentication).
    *   Granting necessary IAM roles (requires user authentication).
    *   Building the application (`npm run build`).
    *   Authenticating as the Deployer Service Account using the generated key.
    *   Submitting the build to Cloud Build / Artifact Registry.
    *   Deploying the service to Cloud Run.

Refer to `gcp-cloud-run-deployment-guide.md` for a detailed breakdown of the manual steps the script automates.
