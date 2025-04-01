# Guide: Deploying mKit to GCP From Scratch

**Purpose:** This guide outlines the complete process for deploying the mKit application to Google Cloud Platform (GCP), starting from a state where **no specific GCP resources** (Cloud Run service, Artifact Registry repository, Service Accounts) exist for this project, and local configuration (Memory Bank, service account keys) needs to be recreated.

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
    *   Choose a `[REPOSITORY_NAME]` (e.g., `mkit-repo`).
    ```bash
    gcloud artifacts repositories create [REPOSITORY_NAME] \
        --repository-format=docker \
        --location=[REGION] \
        --description="Docker images for mKit" \
        --project=[YOUR_PROJECT_ID]
    ```

5.  **Create Service Accounts & Grant Roles:**
    *(Run authenticated as your user account)*
    *   **A. Create Deployer Service Account:** This account performs build/deploy.
        *   Choose a `[DEPLOYER_SA_NAME]` (e.g., `mkit-deployer`).
        ```bash
        gcloud iam service-accounts create [DEPLOYER_SA_NAME] \
            --display-name="mKit Deployment Service Account" \
            --project=[YOUR_PROJECT_ID]
        ```
        *   Note the generated email: `[DEPLOYER_SA_EMAIL]` (format: `[DEPLOYER_SA_NAME]@[YOUR_PROJECT_ID].iam.gserviceaccount.com`).
        *   Grant necessary roles to Deployer SA:
            ```bash
            gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] --member="serviceAccount:[DEPLOYER_SA_EMAIL]" --role="roles/cloudbuild.builds.editor"
            gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] --member="serviceAccount:[DEPLOYER_SA_EMAIL]" --role="roles/run.admin"
            gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] --member="serviceAccount:[DEPLOYER_SA_EMAIL]" --role="roles/artifactregistry.writer"
            gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] --member="serviceAccount:[DEPLOYER_SA_EMAIL]" --role="roles/iam.serviceAccountUser"
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

    **Important:** Keep track of the chosen/identified values: `[YOUR_PROJECT_ID]`, `[REGION]`, `[REPOSITORY_NAME]`, `[DEPLOYER_SA_EMAIL]`, `[KEY_FILE_NAME].json`, `[RUNTIME_SA_EMAIL]`. Also decide on an `[IMAGE_NAME]` (e.g., `mkit-image`) and `[SERVICE_NAME]` (e.g., `mkit-service`) for the next phase.

---

## Phase 2: Application Deployment

**(Perform these steps manually in your terminal from the project root directory)**

1.  **Install Dependencies (if needed):**
    ```bash
    npm install
    cd client && npm install && cd ..
    ```

2.  **Build the Application:**
    *   Use the simplified `npm` script (which only runs the build):
        ```bash
        npm run deploy
        ```
    *   *(Alternatively, run `npm run build` directly).*

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

---

## Phase 3: Post-Deployment (For Cline)

**(Instructions for Cline after a successful deployment from scratch)**

1.  **Confirm Success:** Verify the deployment was successful and the application is accessible at the provided Cloud Run URL.
2.  **Initialize Memory Bank:** Since the Memory Bank was deleted, recreate the core files based on the current project state and the deployment details:
    *   `projectbrief.md`: Define core objective and requirements.
    *   `productContext.md`: Explain the purpose.
    *   `systemPatterns.md`: Document backend/frontend structure, component patterns.
    *   `techContext.md`: List technologies, update deployment section with the manual process and key GCP resource names used (Project ID, Region, Repo, Image, Service Name, Service Accounts).
    *   `progress.md`: Describe current status (deployed), known issues (none expected initially), next steps.
    *   `activeContext.md`: Set current focus, record the successful deployment from scratch as the most recent change.
3.  **Initialize `.clinerules`:** Recreate the `.clinerules` file based on established project patterns (component structure, `useEffect` avoidance, etc.).
4.  **Store Key Values:** Ensure the critical GCP resource names (`PROJECT_ID`, `REGION`, `REPOSITORY_NAME`, `IMAGE_NAME`, `SERVICE_NAME`, `DEPLOYER_SA_EMAIL`, `RUNTIME_SA_EMAIL`, `KEY_FILE_NAME`.json) used during setup are clearly documented, ideally in `memory-bank/techContext.md`.
