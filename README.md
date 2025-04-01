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
- `npm run deploy` - Build the project and submit the Docker image to Google Cloud Build/Artifact Registry

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

1.  **Build & Push Docker Image:**
    The `npm run deploy` script builds the project and submits the build to Google Cloud Build, which creates the Docker image and pushes it to the registry (`gcr.io` by default, based on the command).
    ```bash
    npm run deploy
    ```
    *(This uses the project ID `sage-extension-455512-s0` hardcoded in the script).*

2.  **Deploy to Cloud Run:**
    After the build is pushed, you need to manually deploy it to Cloud Run using the `gcloud run deploy` command. Refer to the `gcp-cloud-run-deployment-guide.md` file for detailed instructions on this step, including required flags like `--image`, `--region`, `--platform`, `--service-account`, and `--allow-unauthenticated`.
    ```bash
    # Example (replace placeholders like REGION, REPO_NAME, IMAGE_NAME, SERVICE_NAME, RUNTIME_SA_EMAIL)
    gcloud run deploy [SERVICE_NAME] \
        --image [REGION]-docker.pkg.dev/sage-extension-455512-s0/[REPO_NAME]/[IMAGE_NAME]:latest \
        --region=[REGION] \
        --platform=managed \
        --service-account [RUNTIME_SA_EMAIL] \
        --allow-unauthenticated
    ```

Refer to `gcp-cloud-run-deployment-guide.md` for generic details on the `gcloud run deploy` command and its flags. The specific setup steps (service accounts, permissions) required for this project are covered in `GCP-INITIAL-SETUP-GUIDE.md`.
