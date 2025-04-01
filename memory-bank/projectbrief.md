# Project Brief: mKit

## Core Objective

Integrate a modern React frontend (using Vite, TypeScript, Zustand, React Router) into the existing Node.js/Express backend within a monorepo structure.

## Key Requirements

-   **Frontend Framework:** React with TypeScript, built using Vite.
-   **State Management:** Zustand, following a pattern that avoids `useEffect` for initialization/data fetching (manual calls or custom `onInit` preferred).
-   **Routing:** React Router DOM for client-side navigation.
-   **Folder Structure:**
    -   Frontend code resides in `/client`.
    -   Components follow `components/[ComponentName]/[ComponentName.tsx, Store.ts, ComponentName.css]`.
    -   Pages follow `pages/[PageName]/[PageName.tsx, Store.ts]`.
    -   Global styles in `client/src/styles/global.css`.
-   **Backend Integration:**
    -   Vite dev server proxies API calls (`/api/*`) to the backend.
    -   Production build serves static client files (`client/dist`) via the Express server.
    -   Express server handles client-side routing fallback in production.
-   **Development Workflow:** Unified scripts in the root `package.json` manage both client and server development and builds.
-   **Documentation:** Maintain project context via the Memory Bank system.
