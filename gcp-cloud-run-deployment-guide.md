# Generic Guide: Deploying a Node.js/TypeScript App to Google Cloud Run

This guide outlines the steps to deploy a containerized Node.js/TypeScript web application to Google Cloud Run using the `gcloud` command-line interface (CLI) and Artifact Registry.

## 1. Prerequisites

*   **Google Cloud Platform (GCP) Account:** You need an active GCP account with billing enabled.
*   **GCP Project:** Create or select a GCP project. Note your **`PROJECT_ID`**.
*   **`gcloud` CLI:** Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) which includes the `gcloud` CLI.
*   **Authenticated `gcloud` CLI:** Log in to your Google account:
    ```bash
    gcloud auth login
    ```
*   **Node.js & npm/yarn:** Ensure Node.js and your preferred package manager are installed locally.
*   **Application Code:** Your Node.js application code should be ready.

## 2. Application Code Setup

*   **Port Configuration:** Modify your server code (e.g., `src/server.ts`) to listen on the port provided by the `PORT` environment variable. Cloud Run injects this variable. Default to 8080 if not set.
    ```typescript
    // Example in Express.js
    const port: number = parseInt(process.env.PORT || '8080', 10);
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
    ```
*   **Build Script:** Ensure your `package.json` has a build script that compiles TypeScript into a JavaScript output directory (commonly `dist`).
    ```json
    // package.json (scripts section)
    "scripts": {
      "build": "tsc -p tsconfig.json",
      // other scripts...
    }
    ```
    *(Adjust `tsc -p tsconfig.json` based on your specific tsconfig file(s).)*
*   **Start Script:** Your `package.json` should ideally have a start script that runs the compiled JavaScript entry point. This isn't strictly required for the `Dockerfile`, but it's good practice.
    ```json
    // package.json (scripts section)
    "scripts": {
      "start": "node dist/server.js", // Adjust path if needed
      "build": "tsc -p tsconfig.json",
      // other scripts...
    }
    ```

## 3. Docker Configuration

*   **Create `Dockerfile`:** In your project root, create a file named `Dockerfile` (no extension). This defines how to build your application's container image.

    ```dockerfile
    # Use an official Node.js runtime (choose a specific LTS version)
    FROM node:18-alpine

    # Set the working directory inside the container
    WORKDIR /usr/src/app

    # Copy package.json and package-lock.json (or yarn.lock)
    # This leverages Docker layer caching
    COPY package*.json ./
    # COPY yarn.lock ./ # If using Yarn

    # Install production dependencies reliably
    RUN npm ci --only=production
    # RUN yarn install --frozen-lockfile --production # If using Yarn

    # Copy the rest of your application code
    # Specifically, copy the compiled JS output and any static assets
    COPY dist/ ./dist/
    COPY public/ ./public/ # Adjust if your static assets are elsewhere

    # The application listens on the port defined by the PORT env var.
    # Cloud Run injects this automatically. EXPOSE is documentation.
    EXPOSE 8080

    # Define the command to run your app using the compiled JS entry point
    CMD ["node", "dist/server.js"] # Adjust path if needed
    ```

*   **Create `.dockerignore`:** In your project root, create a file named `.dockerignore`. This speeds up builds and reduces image size by excluding unnecessary files from the Docker build context.

    ```
    # Files and directories to ignore during Docker build

    node_modules
    npm-debug.log
    yarn-error.log
    .env
    src/
    *.ts
    tsconfig*.json
    Dockerfile
    .dockerignore
    .git
    .gitignore
    .gcloudignore
    README.md
    # Add any other local config files, logs, test files etc.
    ```

## 4. GCP API & Repository Setup

*(Run these commands authenticated as your **user account** (`gcloud auth login`), which typically has permissions to enable APIs and create repositories).*

*   **Enable Necessary APIs:**
    ```bash
    gcloud services enable run.googleapis.com \
                         cloudbuild.googleapis.com \
                         artifactregistry.googleapis.com \
                         cloudresourcemanager.googleapis.com \
                         iam.googleapis.com \
                         serviceusage.googleapis.com \
                         --project=YOUR_PROJECT_ID
    ```
    *(Replace `YOUR_PROJECT_ID` with your actual GCP Project ID).*

*   **Create Artifact Registry Repository:** Create a repository to store your Docker images.
    ```bash
    gcloud artifacts repositories create YOUR_REPO_NAME \
        --repository-format=docker \
        --location=YOUR_REGION \
        --description="Docker images for my application" \
        --project=YOUR_PROJECT_ID
    ```
    *(Replace `YOUR_REPO_NAME` (e.g., `my-app-repo`), `YOUR_REGION` (e.g., `us-central1`), and `YOUR_PROJECT_ID`)*.

## 5. Service Account Setup (Best Practice)

Using dedicated service accounts improves security by granting least privilege.

*(Run IAM commands authenticated as your **user account** (`gcloud auth login`), which needs permission to manage IAM policies, e.g., Owner or Project IAM Admin role).*

*   **A. Create Deployer Service Account:** This account will perform the build and deployment actions.

    1.  **Create SA:**
        ```bash
        gcloud iam service-accounts create YOUR_DEPLOYER_SA_NAME \
            --display-name="Deployment Service Account" \
            --description="Service account for building and deploying the application" \
            --project=YOUR_PROJECT_ID
        ```
        *(Replace `YOUR_DEPLOYER_SA_NAME` (e.g., `app-deployer`). Note the full email generated, e.g., `app-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com`)*.

    2.  **Grant Roles to Deployer SA:**
        ```bash
        # Allow submitting builds
        gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
            --member="serviceAccount:YOUR_DEPLOYER_SA_EMAIL" \
            --role="roles/cloudbuild.builds.editor"

        # Allow deploying/managing Cloud Run services
        gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
            --member="serviceAccount:YOUR_DEPLOYER_SA_EMAIL" \
            --role="roles/run.admin"

        # Allow reading/writing images from/to Artifact Registry
        gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
            --member="serviceAccount:YOUR_DEPLOYER_SA_EMAIL" \
            --role="roles/artifactregistry.writer" # Includes read permissions

        # Allow deployer SA to act as the runtime SA during deployment
        gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
            --member="serviceAccount:YOUR_DEPLOYER_SA_EMAIL" \
            --role="roles/iam.serviceAccountUser"
        ```
        *(Replace `YOUR_PROJECT_ID` and `YOUR_DEPLOYER_SA_EMAIL`)*.

    3.  **Create & Download Key for Deployer SA:**
        ```bash
        gcloud iam service-accounts keys create ./deployer-key.json \
            --iam-account=YOUR_DEPLOYER_SA_EMAIL \
            --project=YOUR_PROJECT_ID
        ```
        *(Replace `YOUR_DEPLOYER_SA_EMAIL` and `YOUR_PROJECT_ID`. This downloads `deployer-key.json` to your current directory).*
        **SECURITY:** Keep this key file secure! Add `*.json` or the specific key filename to your `.gitignore` file.

*   **B. Grant Roles to Runtime Service Account:** This is the identity the Cloud Run service *runs as*. It needs permission to pull the container image.

    1.  **Identify Runtime SA:** By default, Cloud Run uses the **Compute Engine default service account**. Its email format is `PROJECT_NUMBER-compute@developer.gserviceaccount.com`. Find your `PROJECT_NUMBER` in the GCP Console. Alternatively, you can create a dedicated runtime SA (recommended for stricter permissions later). For simplicity, we'll use the default here.
    2.  **Grant Roles to Runtime SA:**
        ```bash
        # Allow reading images from Artifact Registry/GCR
        gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
            --member="serviceAccount:YOUR_RUNTIME_SA_EMAIL" \
            --role="roles/artifactregistry.reader"

        # Also add Storage Object Viewer for wider GCS read access (belt-and-suspenders)
        gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
            --member="serviceAccount:YOUR_RUNTIME_SA_EMAIL" \
            --role="roles/storage.objectViewer"
        ```
        *(Replace `YOUR_PROJECT_ID` and `YOUR_RUNTIME_SA_EMAIL` (e.g., `PROJECT_NUMBER-compute@developer.gserviceaccount.com`)).*

## 6. Deployment Steps (`gcloud` CLI)

1.  **Build Application Locally:** Compile your TypeScript.
    ```bash
    npm run build
    # or yarn build
    ```
2.  **Authenticate as Deployer SA:**
    ```bash
    gcloud auth activate-service-account --key-file=./deployer-key.json
    ```
    *(Ensure the path to your key file is correct).*
3.  **Set Project Config (Optional but Recommended):**
    ```bash
    gcloud config set project YOUR_PROJECT_ID
    ```
4.  **Create `.gcloudignore` (If Needed):** If your `.gitignore` excludes build artifacts (like the `dist` directory), create a `.gcloudignore` file in your project root to ensure necessary files *are* uploaded to Cloud Build.
    ```
    # .gcloudignore
    # Ensure necessary files ARE uploaded
    !dist/
    !public/
    !Dockerfile
    !package.json
    !package-lock.json # Or yarn.lock

    # Ignore other files
    node_modules/
    .git/
    src/
    *.ts
    tsconfig*.json
    .env*
    .gitignore
    .dockerignore
    .gcloudignore
    *.log
    deployer-key.json # Ignore the key file!
    # Add other local files/dirs
    ```
5.  **Submit Build to Cloud Build:** This builds the Docker image and pushes it to Artifact Registry.
    ```bash
    gcloud builds submit --tag YOUR_REGION-docker.pkg.dev/YOUR_PROJECT_ID/YOUR_REPO_NAME/YOUR_IMAGE_NAME:latest .
    ```
    *(Replace `YOUR_REGION`, `YOUR_PROJECT_ID`, `YOUR_REPO_NAME`, and `YOUR_IMAGE_NAME` (e.g., `my-app`). The `.` indicates the current directory is the build context).*
6.  **Deploy to Cloud Run:**
    ```bash
    gcloud run deploy YOUR_SERVICE_NAME \
        --image YOUR_REGION-docker.pkg.dev/YOUR_PROJECT_ID/YOUR_REPO_NAME/YOUR_IMAGE_NAME:latest \
        --platform managed \
        --region YOUR_REGION \
        --service-account YOUR_RUNTIME_SA_EMAIL \
        --allow-unauthenticated
    ```
    *(Replace placeholders: `YOUR_SERVICE_NAME` (e.g., `my-app`), image URL, `YOUR_REGION`, `YOUR_RUNTIME_SA_EMAIL`).*
    *   `--allow-unauthenticated`: Makes the service publicly accessible. Remove this flag for private services requiring IAM authentication.
    *   `--service-account`: Specifies the identity the service runs as (important for permissions).

7.  **Check Service URL:** The command output will provide the URL for your deployed service.

## 7. Troubleshooting Tips

*   **Permission Denied Errors (`PERMISSION_DENIED`):** Carefully check which account is running the command (`gcloud auth list`) and ensure that account has the specific role mentioned in the error message (or a higher-level role like Owner/Editor, though less secure). Check both the **deployer** SA and the **runtime** SA permissions. IAM changes can take a few minutes to propagate.
*   **API Not Enabled:** Use `gcloud services enable API_NAME --project=YOUR_PROJECT_ID` (run as user account).
*   **Image Not Found / Cannot Pull Image:** Double-check image URL correctness. Ensure the **runtime** service account (`--service-account` flag in deploy command) has `roles/artifactregistry.reader` and `roles/storage.objectViewer`.
*   **Build Failures (`gcloud builds submit`):** Check the Cloud Build logs linked in the output. Common issues include missing files (check `.gcloudignore`), Dockerfile syntax errors, or failed `npm install` steps.
*   **Check IAM Roles:** Use `gcloud projects get-iam-policy YOUR_PROJECT_ID --flatten="bindings[].members" --format='table(bindings.role)' --filter="bindings.members:serviceAccount:EMAIL"` (run as user account) to verify roles assigned to a specific service account.

This guide provides a solid foundation. Adapt paths, filenames, and service names according to your specific project structure and needs.
