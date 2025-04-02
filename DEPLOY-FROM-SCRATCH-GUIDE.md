# Guide: Deploying Node.js Applications to GCP From Scratch

**Purpose:** This guide outlines the complete process for deploying a Node.js application to Google Cloud Platform (GCP), starting from a state where **no specific GCP resources** (Cloud Run service, Artifact Registry repository, Service Accounts) exist for this project, and local configuration needs to be recreated.

**Workflow:** The process involves manual setup of GCP resources using the `gcloud` CLI, followed by manual build and deployment steps.

---

## Phase 1: Prerequisites & Initial GCP Setup

**(Perform these steps manually in your terminal)**

1.  **Local Prerequisites:**
    *   Ensure Node.js and npm are installed.
    *   Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud` CLI).
    *   Authenticate the `gcloud` CLI with your Google user account which has permissions to create projects (or use an existing one) and manage resources (APIs, IAM, Artifact Registry, Cloud Run):
        ```bash
        gcloud auth login
        ```

2.  **GCP Project:**
    *   Choose an existing GCP Project ID or create a new one via the console or `gcloud projects create [PROJECT_ID]`. Note this ID.
    *   Set your project context:
        ```bash
        # Replace [YOUR_PROJECT_ID] with the actual ID
        gcloud config set project [YOUR_PROJECT_ID]
        ```
    *   Ensure billing is enabled for the project.

3.  **Enable Necessary APIs:**
    *(Run authenticated as your user account)*
    ```bash
    gcloud services enable run.googleapis.com \
                         cloudbuild.googleapis.com \
                         artifactregistry.googleapis.com \
                         cloudresourcemanager.googleapis.com \
                         iam.googleapis.com \
                         serviceusage.googleapis.com \
                         --project=[YOUR_PROJECT_ID]
    ```

4.  **Create Artifact Registry Repository:**
    *(Run authenticated as your user account)*
    *   Choose a `[REGION]` (e.g., `us-central1`).
    *   Choose a `[REPOSITORY_NAME]` for your Docker images.
    ```bash
    gcloud artifacts repositories create [REPOSITORY_NAME] \
        --repository-format=docker \
        --location=[REGION] \
        --description="Docker images for application" \
        --project=[YOUR_PROJECT_ID]
    ```

5.  **Create Service Accounts & Grant Roles:**
    *(Run authenticated as your user account)*
    *   **A. Create Deployer Service Account:** This account performs build/deploy.
        *   Choose a `[DEPLOYER_SA_NAME]` (e.g., `app-deployer`).
        ```bash
        gcloud iam service-accounts create [DEPLOYER_SA_NAME] \
            --display-name="Deployment Service Account" \
            --project=[YOUR_PROJECT_ID]
        ```
        *   Note the generated email: `[DEPLOYER_SA_EMAIL]` (format: `[DEPLOYER_SA_NAME]@[YOUR_PROJECT_ID].iam.gserviceaccount.com`).
        *   Grant necessary roles to Deployer SA:
            ```bash
            gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] --member="serviceAccount:[DEPLOYER_SA_EMAIL]" --role="roles/cloudbuild.builds.editor"
            gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] --member="serviceAccount:[DEPLOYER_SA_EMAIL]" --role="roles/run.admin"
            gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] --member="serviceAccount:[DEPLOYER_SA_EMAIL]" --role="roles/artifactregistry.writer"
            gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] --member="serviceAccount:[DEPLOYER_SA_EMAIL]" --role="roles/iam.serviceAccountUser"
            # Additional required roles for successful deployment
            gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] --member="serviceAccount:[DEPLOYER_SA_EMAIL]" --role="roles/serviceusage.serviceUsageConsumer"
            gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] --member="serviceAccount:[DEPLOYER_SA_EMAIL]" --role="roles/storage.admin"
            ```
        *   Create and download its key file (store securely, add to `.gitignore`!):
            ```bash
            # Choose a [KEY_FILE_NAME].json (e.g., deployer-key.json)
            gcloud iam service-accounts keys create ./[KEY_FILE_NAME].json \
                --iam-account=[DEPLOYER_SA_EMAIL] \
                --project=[YOUR_PROJECT_ID]
            ```
    *   **B. Identify/Create Runtime Service Account:** This is the identity the Cloud Run service runs as.
        *   **Option 1 (Default):** Use the Compute Engine default service account. Find its email in the GCP Console (IAM section) or using `gcloud projects describe [YOUR_PROJECT_ID] --format='value(projectNumber)'` to get the project number and forming the email: `[PROJECT_NUMBER]-compute@developer.gserviceaccount.com`. Let this be `[RUNTIME_SA_EMAIL]`.
        *   **Option 2 (Custom):** Create a dedicated runtime SA (similar to Deployer SA creation) and note its email as `[RUNTIME_SA_EMAIL]`.
    *   **C. Grant Roles to Runtime SA:**
        ```bash
        # Allow reading images from Artifact Registry
        gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] --member="serviceAccount:[RUNTIME_SA_EMAIL]" --role="roles/artifactregistry.reader"
        # Recommended for broader read access
        gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] --member="serviceAccount:[RUNTIME_SA_EMAIL]" --role="roles/storage.objectViewer"
        ```
    *(Allow a few minutes for IAM changes to propagate).*

    **Important:** Keep track of the chosen/identified values: `[YOUR_PROJECT_ID]`, `[REGION]`, `[REPOSITORY_NAME]`, `[DEPLOYER_SA_EMAIL]`, `[KEY_FILE_NAME].json`, `[RUNTIME_SA_EMAIL]`. Also decide on an `[IMAGE_NAME]` and `[SERVICE_NAME]` for the next phase.

## Docker Configuration

1. **Dockerfile Structure:**
   Use a multi-stage build approach for optimal image size and security:
   ```dockerfile
   # Use the official Node.js image as base
   FROM node:18-alpine as builder

   # Set working directory
   WORKDIR /app

   # Copy package files
   COPY package*.json ./

   # Install dependencies
   RUN npm ci --only=production

   # Copy compiled server files and pre-built client dist
   COPY dist ./dist
   COPY client/dist ./client/dist
   COPY public ./public

   # Use a smaller image for runtime
   FROM node:18-alpine

   # Set working directory
   WORKDIR /app

   # Copy built files from builder
   COPY --from=builder /app/package*.json ./
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/client/dist ./client/dist
   COPY --from=builder /app/public ./public

   # Expose port (matches server.ts PORT env var)
   EXPOSE 8080

   # Health check
   HEALTHCHECK --interval=30s --timeout=3s \
     CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

   # Start the server
   CMD ["node", "dist/server.js"]
   ```

2. **Required .dockerignore Configuration:**
   ```
   # Ignore node_modules, as dependencies will be installed inside the container
   node_modules

   # Ignore source TypeScript files, as we only need the compiled JS in dist/
   src/
   *.ts
   # Keep tsconfig files, vite config, and client source files as they're needed for building
   !tsconfig.json
   !tsconfig.server.json
   !client/tsconfig.json
   !client/tsconfig.app.json
   !client/tsconfig.node.json
   !client/vite.config.ts
   !client/src/**/*.ts
   !client/src/**/*.tsx

   # Ignore development/build tooling configuration
   eslint.config.js
   nodemon.json
   browser-sync.config.cjs
   .gitignore
   .git
   .vscode

   # Ignore documentation and non-essential files
   README.md
   memory-bank/
   ```

3. **Server Configuration for Client Files:**
   When serving client files in production, use absolute paths in your server.ts file:
   ```typescript
   // --- Serve React App Static Files (Production Only) ---
   if (process.env.NODE_ENV === 'production') {
     // Use absolute path for client build
     const clientBuildPath = '/app/client/dist';
     console.log('Client build path:', clientBuildPath);
     
     app.use(express.static(clientBuildPath));

     // --- Catch-all for Client-Side Routing (Production Only) ---
     app.get('*', (_req: Request, res: Response): void => {
       const indexPath = path.join(clientBuildPath, 'index.html');
       console.log('Serving index from:', indexPath);
       res.sendFile(indexPath);
     });
   }
   ```
   **IMPORTANT:** Using absolute paths that match your Docker container structure is critical for successful deployment.

## Phase 2: Application Deployment

**(Perform these steps manually in your terminal from the project root directory)**

### Authentication Flow:

Throughout the deployment process, you'll need to switch between your user account and the service account:

1. **User Account Authentication** (for resource creation/IAM changes):
   ```bash
   gcloud auth login
   ```
   Use when: Creating resources, modifying IAM policies, or viewing logs

2. **Service Account Authentication** (for deployment):
   ```bash
   gcloud auth activate-service-account --key-file=./[KEY_FILE_NAME].json
   ```
   Use when: Building/pushing images, deploying to Cloud Run

Note: Always verify which account you're using with:
```bash
gcloud auth list
```

### Deployment Steps:

1.  **Install Dependencies (if needed):**
    ```bash
    npm install
    cd client && npm install && cd ..
    ```

2.  **Build the Application:**
    *   Use your build script:
        ```bash
        npm run build
        ```

3.  **Build & Push Docker Image:**
    *   Authenticate as the Deployer Service Account using its key file:
        ```bash
        # Replace [KEY_FILE_NAME].json with the actual key file name/path noted during setup
        gcloud auth activate-service-account --key-file=./[KEY_FILE_NAME].json
        ```
    *   Submit the build to Cloud Build (this builds the image using `Dockerfile` and pushes it to Artifact Registry):
        ```bash
        # Replace placeholders with the values noted/chosen during setup
        gcloud builds submit --tag [REGION]-docker.pkg.dev/[YOUR_PROJECT_ID]/[REPOSITORY_NAME]/[IMAGE_NAME]:latest . --project=[YOUR_PROJECT_ID]
        ```

4.  **Deploy Image to Cloud Run:**
    *   *(You should still be authenticated as the Deployer SA from the previous step)*
    *   Deploy the service:
        ```bash
        # Replace placeholders with the values noted/chosen during setup
        gcloud run deploy [SERVICE_NAME] \
            --image=[REGION]-docker.pkg.dev/[YOUR_PROJECT_ID]/[REPOSITORY_NAME]/[IMAGE_NAME]:latest \
            --region=[REGION] \
            --platform=managed \
            --service-account=[RUNTIME_SA_EMAIL] \
            --allow-unauthenticated `# Makes the service publicly accessible. Remove if authentication is needed.` \
            --project=[YOUR_PROJECT_ID]
        ```
    *   *(Optional: Re-authenticate as your user: `gcloud auth login`)*

5.  **Automating Deployment (Recommended):**
    After confirming the manual deployment works, automate the process by adding a deploy script to your `package.json`:
    ```json
    {
      "scripts": {
        "deploy": "npm run build && gcloud builds submit --tag [REGION]-docker.pkg.dev/[YOUR_PROJECT_ID]/[REPOSITORY_NAME]/[IMAGE_NAME]:latest . && gcloud run deploy [SERVICE_NAME] --image=[REGION]-docker.pkg.dev/[YOUR_PROJECT_ID]/[REPOSITORY_NAME]/[IMAGE_NAME]:latest --region=[REGION] --platform=managed --service-account=[RUNTIME_SA_EMAIL] --allow-unauthenticated --project=[YOUR_PROJECT_ID]"
      }
    }
    ```
    Now you can deploy with a single command:
    ```bash
    npm run deploy
    ```

## Troubleshooting

### Common Issues and Solutions:

1. **Cloud Build Permission Errors:**
   ```
   ERROR: (gcloud.builds.submit) The user is forbidden from accessing the bucket
   ```
   Solution: Ensure the deployer service account has both `serviceusage.serviceUsageConsumer` and `storage.admin` roles.

2. **Package Files Not Found During Build:**
   ```
   COPY failed: no source files were specified
   ```
   Solution: 
   - Check .dockerignore isn't excluding package*.json files
   - Verify correct COPY commands in Dockerfile
   - Ensure you're in the correct directory when running build

3. **Service Account Authentication Issues:**
   ```
   ERROR: (gcloud.projects.add-iam-policy-binding) PERMISSION_DENIED
   ```
   Solution: Switch back to user account:
   ```bash
   gcloud auth login
   ```
   Then retry the command

4. **Path Resolution Issues in Container:**
   ```
   Error: ENOENT: no such file or directory, stat '/client/dist/index.html'
   ```
   Solution:
   - Use absolute paths in server.ts that match your Docker container structure
   - Change from relative paths like `path.join(__dirname, '../../client/dist')` to absolute paths like `/app/client/dist`
   - Add logging to debug path issues: `console.log('Client build path:', clientBuildPath)`
   - Ensure the paths in your Dockerfile COPY commands match the paths in your server code

5. **Region Access Issues:**
   If encountering region-specific errors, verify:
   - Region is properly specified in all commands
   - Region supports all required services
   - Default region is us-central1 for best compatibility

---

## Phase 3: Post-Deployment

1.  **Confirm Success:** Verify the deployment was successful and the application is accessible at the provided Cloud Run URL.

2.  **Document Deployment Information:**
    Store the following information in your project documentation:
    * Project ID
    * Region
    * Repository name
    * Image name
    * Service name
    * Service account details
    * Any environment-specific configurations

3.  **Store Key Values:** Keep track of all critical GCP resource names used during setup:
    * `PROJECT_ID`
    * `REGION`
    * `REPOSITORY_NAME`
    * `IMAGE_NAME`
    * `SERVICE_NAME`
    * `DEPLOYER_SA_EMAIL`
    * `RUNTIME_SA_EMAIL`
    * `KEY_FILE_NAME.json`
