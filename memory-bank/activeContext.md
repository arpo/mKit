# Active Context: mKit (2025-04-02)

## Current Focus

-   Completing the initial integration of a React frontend (`/client`) into the existing Node.js backend (`/src`).
-   Establishing and documenting the core development patterns, specifically the separation of component logic (`Script.ts`) from markup (`Component.tsx`) and the strict avoidance of `useEffect` for initialization/setup logic.

## Recent Changes

-   Scaffolded React/Vite/TS project in `/client`.
-   Installed `react-router-dom` and `zustand`.
-   Created initial structure for `components`, `pages`, `styles`.
-   Implemented `Counter` component example.
-   Configured routing in `main.tsx`.
-   Updated `vite.config.ts` for API proxying.
-   Updated `src/server.ts` for production static file serving and routing fallback.
-   Updated root `package.json` scripts for concurrent dev/build.
-   Refactored `Counter` component:
    -   Renamed `Store.ts` to `Script.ts`.
    -   Moved initialization logic to `initCounter()` in `Script.ts`.
    -   Updated `Counter.tsx` to call `initCounter()` and remove direct logic.
-   Updated Memory Bank (`systemPatterns.md`, `techContext.md`) and created `.clinerules` to reflect the established patterns.
-   Fixed TypeScript errors in `About.tsx` and `Home.tsx` (unused React imports) identified during `npm run build`.
-   Removed the root `lint` script from `package.json` as build includes type checking.
-   Completed initial GCP deployment setup (Cloud Run, Cloud Build, Artifact Registry, Service Accounts, IAM roles for project `mkit-001`).
-   Created `DEPLOY-FROM-SCRATCH-GUIDE.md` for initial GCP setup.
-   Created automated `npm run deploy` script in root `package.json` combining build, image push, and Cloud Run deployment steps.
-   Updated `DEPLOY-FROM-SCRATCH-GUIDE.md` to include the automated script setup and details.
-   Updated `README.md` with deployment instructions (Cline method and `npm run deploy`).
-   Installed Mantine UI library (`@mantine/core`, `@mantine/hooks`) in `/client`.
-   Integrated MantineProvider in `client/src/main.tsx` with default dark theme.
-   Updated `memory-bank/techContext.md`.
-   Refactored `Counter` component (`client/src/components/Counter/Counter.tsx`) to use Mantine components (`Paper`, `Text`, `Button`).
-   Removed conflicting custom styles from `client/src/components/Counter/Counter.css`.

## Next Steps

-   Build out further components and pages following the established patterns (`Component.tsx`/`Script.ts`/`Component.css`, no `useEffect`).
-   Start using Mantine components for UI development.
-   Implement actual API interactions using the backend proxy.
-   Refine global styles and potentially leverage Mantine theme customization.
