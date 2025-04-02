# Active Context: mKit (2025-04-02 12:59 PM)

## Current Focus

-   Ensuring the Google Cloud Platform deployment pipeline is stable and documented.
-   Transitioning back to feature development using the established patterns and Mantine UI library.

## Recent Changes

-   Scaffolded React/Vite/TS project in `/client`.
-   Installed `react-router-dom` and `zustand`.
-   Created initial structure for `components`, `pages`, `styles`.
-   Implemented `Counter` component example.
-   Configured routing in `main.tsx`.
-   Updated `vite.config.ts` for API proxying.
-   Updated `server/server.ts` for production static file serving and routing fallback.
-   Updated root `package.json` scripts for concurrent dev/build.
-   Refactored `Counter` component:
    -   Renamed `Store.ts` to `Script.ts`.
    -   Moved initialization logic to `initCounter()` in `Script.ts`.
    -   Updated `Counter.tsx` to call `initCounter()` and remove direct logic.
-   Updated Memory Bank (`systemPatterns.md`, `techContext.md`) and created `.clinerules` to reflect the established patterns.
-   Fixed TypeScript errors in `About.tsx` and `Home.tsx` (unused React imports) identified during `npm run build`.
-   Removed the root `lint` script from `package.json` as build includes type checking.
-   Installed Mantine UI library (`@mantine/core`, `@mantine/hooks`) in `/client`.
-   Integrated MantineProvider in `client/src/main.tsx` with default dark theme.
-   Updated `memory-bank/techContext.md`.
-   Refactored `Counter` component (`client/src/components/Counter/Counter.tsx`) to use Mantine components (`Paper`, `Text`, `Button`).
-   Removed conflicting custom styles from `client/src/components/Counter/Counter.css`.
-   Refactored `Counter.tsx` again to remove inline styles, replacing them with Mantine component props (`ta`, `m`) per `.clinerules`.
-   **GCP Deployment Setup (Project: `mkit-app-1`):**
    -   Created `Dockerfile` using a multi-stage build.
    -   Created `.dockerignore` and `.gcloudignore` files.
    -   Followed initial steps in `DEPLOY-FROM-SCRATCH-GUIDE.md` to set up GCP resources (Artifact Registry, Cloud Build, Cloud Run, Service Accounts, IAM roles).
    -   Successfully built and deployed the initial image to Cloud Run.
    -   **Fixed Deployment Issue:** Diagnosed `ENOENT` error in Cloud Run logs related to serving `index.html`.
    -   Updated `server/server.ts` to use absolute path (`/app/client/dist`) for serving client build files in production.
    -   Updated the `deploy` script in root `package.json` with the correct project ID (`mkit-app-1`), repository (`mkit-repo`), image name (`mkit-image`), and service account details.
    -   Successfully re-deployed the application using `npm run deploy`.
    -   Verified the deployed application is working correctly.
    -   **Updated `DEPLOY-FROM-SCRATCH-GUIDE.md`** to reflect the working multi-stage `Dockerfile`, the absolute path fix in `server.ts`, the correct `.dockerignore` content, and added troubleshooting for path resolution errors.

## Next Steps

-   Thoroughly test the deployed application on Cloud Run.
-   Continue building out application features and components using Mantine UI and the established (`Component.tsx`/`Script.ts`/`Component.css`, no `useEffect`) pattern.
-   Implement API interactions between the frontend and backend.
