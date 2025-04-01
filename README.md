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
- `npm run build` - Build both server and client for production
- `npm run start` - Start the production server (after building)
- `npm run format` - Format code using Prettier
- `npm run deploy` - Builds the project (server and client). Deployment requires manual `gcloud` commands afterwards.

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

## Deployment to Google Cloud Run

This project uses Google Cloud Build to containerize the application and Google Cloud Run to host it.

**Initial One-Time Setup:**
If you are setting up this project in a *new* Google Cloud environment for the first time, follow the steps outlined in `GCP-INITIAL-SETUP-GUIDE.md`. This guide covers enabling APIs, creating service accounts, setting up Artifact Registry, and granting permissions.

**Regular Deployment Prerequisites:**

*   Ensure you have the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed (`gcloud` CLI).
*   Authenticate the `gcloud` CLI with your user account:
    ```bash
    gcloud auth login
    ```
*   Ensure your GCP project (`sage-extension-455512-s0`) has the following APIs enabled: Cloud Build API (`cloudbuild.googleapis.com`), Artifact Registry API (`artifactregistry.googleapis.com`), and Cloud Run API (`run.googleapis.com`).
*   Ensure you have an Artifact Registry Docker repository configured in your project (the `gcloud builds submit` command implicitly pushes to `gcr.io/[PROJECT_ID]/[IMAGE_NAME]`, but using Artifact Registry e.g., `[REGION]-docker.pkg.dev/[PROJECT_ID]/[REPO]/[IMAGE]` is recommended). The build command might need adjustment if using Artifact Registry.

**Usage:**

**Usage:**

**Usage:**

After completing the **Initial One-Time Setup** described in `GCP-INITIAL-SETUP-GUIDE.md`, follow these steps for deployment:

1.  **Build the Project:**
    Run the `deploy` script, which now only performs the build step:
    ```bash
    npm run deploy
    ```

2.  **Build & Push Docker Image via Cloud Build:**
    Manually run the following `gcloud` command in your terminal (ensure your `gcloud` CLI is authenticated with sufficient permissions):
    ```bash
    # Replace placeholders if needed, but these were the last used values:
    # Region: us-central1
    # Project ID: sage-extension-455512-s0
    # Repo Name: mkit-repo
    # Image Name: mkit
    gcloud builds submit --tag us-central1-docker.pkg.dev/sage-extension-455512-s0/mkit-repo/mkit:latest . --project=sage-extension-455512-s0
    ```

3.  **Deploy to Cloud Run:**
    Manually run the following `gcloud` command in your terminal:
    ```bash
    # Replace placeholders if needed, but these were the last used values:
    # Service Name: mkit
    # Region: us-central1
    # Project ID: sage-extension-455512-s0
    # Runtime SA: mkit-deployer@sage-extension-455512-s0.iam.gserviceaccount.com
    gcloud run deploy mkit --image=us-central1-docker.pkg.dev/sage-extension-455512-s0/mkit-repo/mkit:latest --region=us-central1 --platform=managed --service-account=mkit-deployer@sage-extension-455512-s0.iam.gserviceaccount.com --allow-unauthenticated --project=sage-extension-455512-s0
    ```
