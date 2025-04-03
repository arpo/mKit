# Tech Context: mKit

## Backend

-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Language:** JavaScript (CommonJS, `.cjs` files). Originally TypeScript, but converted due to module resolution issues during development.
-   **Package Manager:** npm (root level)
-   **Development:** `nodemon` watching `.cjs` files.
-   **Dependencies:** `express`, `dotenv`, `multer`, `replicate`, `@fal-ai/serverless-client`.
-   **Deployment:** Dockerfile exists (for containerization via Cloud Build). See `Tooling & Conventions` below.

## Frontend (`/client`)

-   **Framework:** React
-   **Language:** TypeScript
-   **Build Tool:** Vite
-   **Package Manager:** npm (client level)
-   **Routing:** `react-router-dom`
-   **State Management:** `zustand`
-   **UI Library:** Mantine (`@mantine/core`, `@mantine/hooks`) - Configured with default dark theme.
-   **Styling:** Primarily Mantine's styling system (props, theme, functions), supplemented by global CSS (`client/src/styles/global.css`) and optional component CSS (`.css`) files. Inline styles avoided.
-   **Development:** Vite Dev Server (with HMR), API proxy configured in `vite.config.ts`.

## Tooling & Conventions

-   **Monorepo Structure:** Backend in `/server`, Frontend in `/client`. Shared scripts in root `package.json`.
-   **Component Logic:** Logic/state (`zustand`) resides in `Script.ts`, separate from markup (`Component.tsx`).
-   **`useEffect` Avoidance:** See `systemPatterns.md` for the pattern using exported functions from `Script.ts`.
-   **Type Checking:** TypeScript (via `npm run build`)
-   **Formatting:** Prettier (`npm run format`)
-   **Deployment (GCP):**
    *   **Hosting:** Google Cloud Run (`mkit-service` in `us-central1` for project `mkit-app-1`).
    *   **Containerization:** Docker (`Dockerfile`).
    *   **Build:** Google Cloud Build triggered via `gcloud builds submit`.
    *   **Image Registry:** Google Artifact Registry (`mkit-repo` in `us-central1` for project `mkit-app-1`).
    *   **Automation:** `npm run deploy` script handles build and basic deployment.
    *   **Secrets Management:** API keys (Replicate, Fal AI) and `NODE_ENV` are managed **directly in the Cloud Run service configuration** (via UI or `gcloud run services update`). They are **NOT** set via flags in the `npm run deploy` script to avoid committing secrets.
    *   **Setup/Details:** See `DEPLOY-FROM-SCRATCH-GUIDE.md` and `README.md` (Deployment section).
