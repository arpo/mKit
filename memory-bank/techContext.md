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
-   **Styling:** CSS (global + component-specific modules)
-   **Development:** Vite Dev Server (with HMR), API proxy configured in `vite.config.ts`.

## Tooling & Conventions

-   **Monorepo Structure:** Backend in `/src`, Frontend in `/client`. Shared scripts in root `package.json`.
-   **Component Logic:** Logic/state (`zustand`) resides in `Script.ts`, separate from markup (`Component.tsx`).
-   **`useEffect` Avoidance:** See `systemPatterns.md` for the pattern using exported functions from `Script.ts`.
-   **Type Checking:** TypeScript (via `npm run build`)
-   **Formatting:** Prettier (`npm run format`)
-   **Deployment:** Uses Docker (`Dockerfile`) for containerization. Manual deployment process involves building locally (`npm run build` or `npm run deploy`) followed by manual `gcloud` commands (builds submit, run deploy). See `DEPLOY-FROM-SCRATCH-GUIDE.md` for detailed setup and deployment steps.
