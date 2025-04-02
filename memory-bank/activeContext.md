# Active Context: mKit (2025-04-02 8:30 PM)

## Current Focus

-   Implement client-side polling for Replicate prediction status (likely in `Home/Script.ts` now that state is consolidated there).
-   Display the final split audio results from Replicate on the frontend.
-   Refine error handling and UI feedback for the audio splitting process.

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
-   **Created `DropArea` Component:**
    -   Installed `@mantine/dropzone` and `@tabler/icons-react` dependencies.
    -   Created `DropArea.tsx`, `Script.ts`, `DropArea.css` in `client/src/components/DropArea/`.
    -   Implemented Mantine `Dropzone` configured for audio files (accept, maxSize=100MB).
    -   Added visual feedback for drag-over (`useWindowEvent`, conditional border).
    -   Implemented display of dropped filenames.
    -   Refactored state management (`isDraggingOverWindow`, `droppedFiles`) into `Script.ts` (Zustand).
    -   Added height transition animation.
    -   Moved static styles to `DropArea.css`.
-   Added `DropArea` component to `client/src/pages/Home/Home.tsx`.
-   **Setup `/api/audio-split` Endpoint:**
    -   Created `.env` file with `REPLICATE_API_TOKEN`.
    -   Installed `dotenv`, `replicate`, `multer` dependencies.
    -   Created `server/ts/audio-split/` directory with `controller.ts` and `routes.ts`.
    -   Implemented Replicate API call logic in `controller.ts` (using base64 data URI).
    -   Implemented Express route in `routes.ts` using `multer` for file upload.
    -   Integrated `dotenv` and mounted the router in `server/server.ts`.
    -   Fixed `tsconfig.server.json` exclusion bug (prior to JS conversion).
-   **Converted Server to JavaScript:**
    -   Renamed `.ts` files (`server.ts`, `controller.ts`, `routes.ts`) to `.js`.
    -   Removed TypeScript syntax (types, imports) and converted to CommonJS (`require`, `module.exports`).
    -   Updated `package.json` scripts (`dev:server`, `start`, `build`, `format`, `deploy`) to remove TS compilation and run `.js` files directly.
    -   Removed `"type": "module"` from `package.json` (later added back).
-   **Reverted Server to ESM Attempt:**
    -   Restored `"type": "module"` in `package.json`.
    -   Changed `tsconfig.server.json` back to `module: "NodeNext"`.
    -   Changed server files back to `import`. (Still resulted in TS errors).
-   **Converted Server to JavaScript (Final):**
    -   Renamed server files (`server.js`, `controller.js`, `routes.js`) to `.cjs` extension.
    -   Converted code to use CommonJS (`require`, `module.exports`).
    -   Updated `package.json` scripts (`dev:server`, `start`, `build`, `format`, `deploy`) for `.cjs` files.
    -   Kept `"type": "module"` in `package.json` (Node handles `.cjs` correctly).
-   **Fixed Vite Proxy:** Updated `client/vite.config.ts` target to `http://localhost:8080`.
-   **Integrated Frontend Upload (Confirmed Working):**
    -   `DropArea/Script.ts` includes state (`isLoading`, `predictionResult`, `error`) and `uploadAudio` action.
    -   Updated `Home.tsx` to call `uploadAudio` on button click, display loading overlay, errors, and initial prediction ID.
    -   Fixed Mantine `Text` component import issue in `Home.tsx`.
-   **Fixed Infinite Loop:** Corrected an infinite re-render loop in `Home.tsx` by switching from a Zustand object selector to individual state selectors, adhering to the pattern now documented in `.clinerules` and `systemPatterns.md`.

## Next Steps

-   Implement client-side polling for Replicate prediction status (consider adding logic to `Home/Script.ts`).
-   Display final results from Replicate.
-   Add ability to clear dropped files in `DropArea`.
-   Thoroughly test the audio splitting feature locally and potentially on Cloud Run.
