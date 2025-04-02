# Tech Context: mKit

## Backend

-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Language:** TypeScript (compiled, server config: `tsconfig.server.json`)
-   **Package Manager:** npm (root level)
-   **Development:** `nodemon`, `tsx`
-   **Deployment:** Dockerfile exists (for containerization via Cloud Build). See `Tooling & Conventions` below.

## Frontend (`/client`)

-   **Framework:** React
-   **Language:** TypeScript
-   **Build Tool:** Vite
-   **Package Manager:** npm (client level)
-   **Routing:** `react-router-dom`
-   **State Management:** `zustand`
-   **UI Library:** Mantine (`@mantine/core`, `@mantine/hooks`) - Configured with default dark theme.
-   **Styling:** Mantine core styles + CSS (global + component-specific modules)
-   **Development:** Vite Dev Server (with HMR), API proxy configured in `vite.config.ts`.

## Tooling & Conventions

-   **Monorepo Structure:** Backend in `/src`, Frontend in `/client`. Shared scripts in root `package.json`.
-   **Component Logic:** Logic/state (`zustand`) resides in `Script.ts`, separate from markup (`Component.tsx`).
-   **`useEffect` Avoidance:** See `systemPatterns.md` for the pattern using exported functions from `Script.ts`.
-   **Type Checking:** TypeScript (via `npm run build`)
-   **Formatting:** Prettier (`npm run format`)
-   **Deployment (GCP):**
    -   **Hosting:** Google Cloud Run (`mkit-service` in `us-central1`).
    -   **Containerization:** Docker (`Dockerfile`).
    -   **Build:** Google Cloud Build triggered via `gcloud builds submit`.
    -   **Image Registry:** Google Artifact Registry (`mkit-docker-repo` in `us-central1`).
    -   **Automation:** Automated build and deployment via `npm run deploy` script in root `package.json`.
    -   **Setup/Details:** See `DEPLOY-FROM-SCRATCH-GUIDE.md` and `README.md` (Deployment section).
