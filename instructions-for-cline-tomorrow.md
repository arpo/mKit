# Instructions for Cline (Tomorrow)

"Hi Cline, let's deploy the mKit project to Google Cloud Run. We want to follow the standard, manual `gcloud` CLI workflow for clarity and learning.

1.  **Refresh Context:** Please start by reading all the core Memory Bank files (`projectbrief.md`, `productContext.md`, `activeContext.md`, `systemPatterns.md`, `techContext.md`, `progress.md`) and the `.clinerules` file.
2.  **Verify Setup:** Check `package.json` to ensure the `deploy` script is just `npm run build`. Also, review the `README.md` file, specifically the 'Deployment to Google Cloud Run' section, to understand the manual steps we documented.
3.  **Step 1: Build the Project:** Run the command `npm run deploy`. Wait for confirmation that the build completed successfully.
4.  **Step 2: Build & Push Docker Image:** Execute the `gcloud builds submit...` command exactly as shown in the `README.md`'s 'Build & Push Docker Image via Cloud Build' section. Explain what this command does before running it. Wait for confirmation that the image was built and pushed successfully.
5.  **Step 3: Deploy to Cloud Run:** Execute the `gcloud run deploy...` command exactly as shown in the `README.md`'s 'Deploy to Cloud Run' section. Explain what this command does before running it. Wait for confirmation that the service was deployed successfully.
6.  **Complete:** Once deployed, report the outcome."
