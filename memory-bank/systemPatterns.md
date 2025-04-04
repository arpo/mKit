# System Patterns: mKit

## Backend

-   **Framework:** Node.js with Express.js (`server/server.cjs`).
-   **API:** Exposes API endpoints under the `/api/` prefix. Key endpoints include:
    -   `/api/audio-service`: Handles audio separation. Accepts `POST` requests with form data containing an `audio` file and a `?service=` query parameter (`falai` for Spleeter, `demucs` for Demucs). Uses `replicate.predictions.create` to start the job and returns a prediction ID. Requires polling `GET /api/audio-service/status/:id` to get the final result (URLs for separated stems).
    -   `/api/audio-to-text`: Handles audio transcription via Replicate.
    -   `/api/gemini`: Handles text formatting via Gemini.
-   **Serving:** Serves static frontend assets (`client/dist`) in production and handles client-side routing fallback.

## Frontend (`/client` directory)

-   **Framework:** React with TypeScript, built using Vite.
-   **Routing:** `react-router-dom` for client-side navigation, configured in `client/src/main.tsx`.
-   **State Management:** Zustand (`zustand`). State stores are typically defined within the logic file (`Script.ts`) for the relevant component or page.
    -   **Selector Pattern:** To prevent unnecessary re-renders caused by Zustand's default shallow equality check, **use individual selectors** for each piece of state needed by a component, rather than selecting a single object containing multiple state properties.
        ```typescript
        // Good: Individual selectors
        const isLoading = useMyStore((state: MyState) => state.isLoading); // Added type hint for clarity
        const data = useMyStore((state: MyState) => state.data); // Added type hint for clarity

        // Avoid: Object selector (can cause re-renders even if unchanged properties differ)
        // const { isLoading, data } = useMyStore((state) => ({ isLoading: state.isLoading, data: state.data }));
        ```
-   **Styling:** Primarily using Mantine's styling system (component props, theme variables, style functions). Global styles in `client/src/styles/global.css`. Separate component CSS files (`[ComponentName].css`) are used only when Mantine's system is insufficient or for non-Mantine elements. Inline styles (`style` prop) are avoided (see `.clinerules`).

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

## Core Pattern: Avoid `useEffect` for Initialization & Data Fetching

-   **`useEffect` is strongly discouraged** for initializing component state, setting up subscriptions, or fetching data on component mount. These operations should occur within the logic layer (`Script.ts`).
-   **Preferred Pattern:**
    1.  Define initialization logic (e.g., data fetching, subscriptions) within functions in the component's `Script.ts` file.
    2.  Call these initialization functions directly at the beginning of the component's function body in the `.tsx` file. This ensures they run only when the component renders.
    ```typescript
    // Example in Component.tsx
    import { initComponent, useMyStore, MyState } from './Script'; // Assuming MyState is defined for Zustand

    function MyComponent() {
      // Directly call initialization logic from Script.ts
      initComponent(); // Assuming initComponent handles data fetching or setup

      const data = useMyStore((state: MyState) => state.data); // Example of selecting state from Zustand store
      // ... rest of component render logic
    }
    ```
-   This approach centralizes initialization logic within `Script.ts`, keeping the `.tsx` file cleaner and focused on rendering and state selection via hooks like `useMyStore`.
-   `useEffect` should primarily be reserved for managing side effects related to *external* factors, such as browser APIs (e.g., timers, event listeners) or integrating with third-party libraries that explicitly require its cleanup mechanism. Avoid using `useEffect` for core application logic or data fetching.

## Deployment Pattern (GCP)

-   **Containerization:** The application (Node.js backend + React frontend build) is packaged into a Docker image using the `Dockerfile` located in the root directory.
-   **Image Registry:** Docker images are stored and managed in Google Artifact Registry (GAR) under the repository `mkit-repo` (location `us-central1`, project `mkit-app-1`).
-   **Build & Deployment Pipeline:** A Google Cloud Build trigger automatically builds and pushes a new image to GAR whenever code is pushed to the `main` branch on GitHub. This trigger executes the build defined in the `cloudbuild.yaml` file (if present) or uses default build steps.
-   **Hosting:** The containerized application is deployed and hosted on Google Cloud Run (`mkit-service` service in `us-central1` for project `mkit-app-1`). Cloud Run provides serverless, managed hosting with auto-scaling.
-   **Secrets Management:** Sensitive configuration data like API keys (`REPLICATE_API_TOKEN`, `GEMINI_API_KEY`) is securely managed using Google Secret Manager and injected into the Cloud Run service as environment variables. They are NOT stored in source code or build artifacts.
-   **Automation:** The `npm run deploy` command initiates the build and deployment process via Google Cloud Build, likely using `gcloud builds submit --config cloudbuild.yaml .` or a similar command defined in `package.json`.
