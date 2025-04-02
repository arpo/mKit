# System Patterns: mKit

## Backend

-   **Framework:** Node.js with Express.js (`src/server.ts`).
-   **API:** Exposes API endpoints (likely under `/api/` prefix).
-   **Serving:** Serves static frontend assets (`client/dist`) in production and handles client-side routing fallback.

## Frontend (`/client` directory)

-   **Framework:** React with TypeScript, built using Vite.
-   **Routing:** `react-router-dom` for client-side navigation, configured in `client/src/main.tsx`.
-   **State Management:** Zustand (`zustand`). State stores are typically defined within the logic file for the relevant component or page.
-   **Styling:** Global styles in `client/src/styles/global.css`, component-specific styles in `[ComponentName].css`.

## Component Structure & Logic Separation

Components and Pages generally follow this structure to enforce separation of concerns:

1.  **`Component.tsx` / `Page.tsx`:**
    *   Contains the React component function.
    *   **Primary Responsibility:** JSX markup and rendering logic.
    *   Imports state selectors and actions from `Script.ts`.
    *   Imports and calls initialization/helper functions from `Script.ts` when needed (e.g., `initComponent()`).
    *   Should contain minimal logic directly; delegate to `Script.ts`.

2.  **`Script.ts`:**
    *   **Primary Responsibility:** Component/page-specific logic, state, and actions.
    *   Contains the Zustand store (`create<...>`), state interfaces, and actions.
    *   Exports functions for initialization, data fetching triggers, or complex logic (e.g., `initComponent`, `fetchData`). These functions interact with the Zustand store (`getState`, `setState`).
    *   This file houses the "business logic" associated with the component/page.

3.  **`Component.css` (Optional):**
    *   Contains component-specific CSS rules. Imported directly by `Component.tsx`.

## Core Pattern: Avoid `useEffect` for Initialization/Setup

-   **`useEffect` is strongly discouraged** for component initialization, one-time setup, or triggering data fetching on mount.
-   **Preferred Pattern:**
    1.  Define logic (e.g., checking state, calling API fetch actions) within exported functions in `Script.ts` (e.g., `initComponent`).
    2.  Import and call this function *directly* at the top of the component function body in `Component.tsx`.
    ```typescript
    // Example in Component.tsx
    import { initComponent, useMyStore, MyState } from './Script';

    function MyComponent() {
      initComponent(); // Run initialization logic from Script.ts

      const data = useMyStore((state: MyState) => state.data);
      // ... rest of component
    }
    ```
-   This pattern keeps side effects and setup logic contained within `Script.ts`, making the `.tsx` file cleaner and focused on rendering.
-   `useEffect` should only be considered as a last resort for specific scenarios involving synchronization with *external*, non-React systems or libraries that explicitly require it.

## Deployment Pattern (GCP)

-   **Containerization:** The application (Node.js backend + built React frontend) is packaged into a Docker image using the `Dockerfile` in the root directory.
-   **Image Registry:** Docker images are stored in Google Artifact Registry (`mkit-docker-repo` in `us-central1`).
-   **Build Process:** Google Cloud Build is used to build the Docker image from the source code and push it to Artifact Registry (`gcloud builds submit`).
-   **Hosting:** The containerized application is deployed and hosted on Google Cloud Run (`mkit-service` in `us-central1`) as a managed, serverless service (`gcloud run deploy`).
-   **Automation:** The entire build and deployment process is automated via the `npm run deploy` script in the root `package.json`.
