# Active Context: mKit (2025-04-01)

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
-   Removed the root `lint` script from `package.json` as build includes type checking and the script was causing environment issues.
-   Simplified the `deploy` script in `package.json` to only run `npm run build && gcloud builds submit --project=sage-extension-455512-s0 .`.
-   Replaced the interactive setup script (`scripts/deploy-to-cloud-run.mjs`) with a documentation file (`GCP-INITIAL-SETUP-GUIDE.md`) outlining the manual steps for initial GCP environment setup. Updated `README.md` accordingly.

## Next Steps

-   Build out further components and pages following the established patterns (`Component.tsx`/`Script.ts`/`Component.css`, no `useEffect`).
-   Implement actual API interactions using the backend proxy.
-   Refine global and component styles.
