# Active Context: mKit (2025-04-03 2:07 PM)

## Current Focus

-   The core audio splitting (Replicate) and audio-to-text (Fal AI) features are now functional both locally and deployed.
-   Potential next steps include refining the UI for displaying results, improving error handling robustness, or adding further features.

## Recent Changes

*   **Integrated Gemini Formatting into Frontend:**
    *   Modified `client/src/pages/Home/Script.ts` (Zustand store):
        *   Added state variables (`isFormatting`, `formattedTranscription`, `formattingError`).
        *   Added `formatTranscription` action to call `/api/gemini` with the lyric formatting prompt.
        *   Modified `startTranscription` action to trigger `formatTranscription` after successful transcription, storing the raw text internally (`rawTranscriptionResult`).
        *   Updated reset logic.
    *   Modified `client/src/pages/Home/Home.tsx`:
        *   Added loading state for formatting.
        *   Display the `formattedTranscription` from Gemini instead of the raw transcription.
        *   Display formatting errors.
*   **Implemented `/api/gemini` Endpoint:**
    *   Added `server/gemini/` route and controller using Google Gemini API (`@google/generative-ai` package).
    *   Installed `@google/generative-ai` dependency.
    *   Configured controller to use `GEMINI_API_KEY` from `.env`.
    *   Mounted router in `server/server.cjs` at `/api/gemini`.
*   Implemented `/api/audio-split` endpoint using Replicate (previously done).
*   **Implemented `/api/audio-to-text` Endpoint:**
    *   Added `server/audio-to-text/` route and controller using Fal AI (`fal-ai/wizper` model).
    *   Installed `@fal-ai/serverless-client` dependency.
*   **Troubleshooting Deployment Issues (`/api/audio-to-text`):**
    *   Resolved `fal.subscribe is not a function` error by switching from `@fal-ai/client` to `@fal-ai/serverless-client` and using dynamic `import()` in the CJS controller (`server/audio-to-text/controller.cjs`) to handle CJS/ESM interop issues in the Cloud Run Node.js environment.
    *   Resolved "Unauthorized" error by correcting Cloud Run environment variable setup:
        *   Ensured correct variable name (`FAL_KEY`) was used.
        *   Removed extra quotes accidentally added around the key value during manual updates.
        *   Ensured `NODE_ENV=production` was consistently set alongside API keys.
    *   Resolved API response structure discrepancy between local (`result.transcription.text`) and deployed (`result.text`) by normalizing the response in the backend controller (`server/audio-to-text/controller.cjs`) to always return `{ text: ..., chunks: ... }`.
    *   Updated frontend (`client/src/pages/Home/Script.ts`) to expect the normalized `{ text: ... }` structure.
*   **Git Push Protection Resolution:**
    *   Removed hardcoded API keys (`--update-env-vars` flags with values) from the `deploy` script in the current `package.json`. Secrets are now managed *only* via Cloud Run environment variables set outside of version control.
    *   Cleaned Git history using interactive rebase (`git rebase -i`) to remove API keys from previous commits (`9175aa9...`, `37b34b6...`, `387ba3d...`).
    *   Successfully force-pushed the cleaned history to GitHub.
*   **Previous Major Changes:**

*   Scaffolded React/Vite/TS project in `/client`.
*   Installed `react-router-dom` and `zustand`.
*   Created initial structure for `components`, `pages`, `styles`.
*   Implemented `Counter` component example.
*   Configured routing in `main.tsx`.
*   Updated `vite.config.ts` for API proxying.
*   Updated `server/server.cjs` (was `.ts`) for production static file serving and routing fallback.
*   Updated root `package.json` scripts for concurrent dev/build.
*   Refactored `Counter` component.
*   Updated Memory Bank (`systemPatterns.md`, `techContext.md`) and `.clinerules`.
*   Fixed TypeScript errors.
*   Installed Mantine UI library.
*   Integrated MantineProvider.
*   Refactored `Counter` component to use Mantine.
*   **GCP Deployment Setup (Project: `mkit-app-1`).**
*   **Created `DropArea` Component.**
*   **Setup `/api/audio-split` Endpoint (Replicate).**
*   **Converted Server to JavaScript (`.cjs`).**
*   **Fixed Vite Proxy.**
*   **Integrated Frontend Upload (Audio Split).**
*   **Fixed Zustand Infinite Loop.**

## Next Steps

*   Refine UI for displaying audio split results (the formatted lyrics display is now implemented).
*   Enhance error handling and user feedback messages (especially around the formatting step).
*   Consider adding tests for new features (Gemini formatting).
*   Continue implementing other project features.
