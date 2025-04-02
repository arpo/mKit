# Product Context: mKit

## Problem Solved

The project previously consisted of a Node.js/Express backend, potentially serving basic HTML/CSS/JS from a `/public` directory. The goal is to add a modern, interactive Single Page Application (SPA) frontend to enhance user experience and enable more complex UI features within the same project repository.

## How it Should Work

-   Users interact primarily with the React frontend running in their browser (served from the `/client` directory).
-   The frontend handles UI rendering, client-side navigation (using React Router), and component/page-level state management (using Zustand).
-   Data is fetched from and sent to the backend API endpoints (exposed by the `server/server.ts` code, likely under an `/api/` prefix).
-   The user experience should be seamless, with the frontend providing a dynamic interface while the backend handles business logic and data persistence.
-   Development workflow allows running both client and server concurrently.
-   Production deployment serves the optimized client build through the Node.js server.

## User Experience Goals

-   Fast, responsive UI.
-   Clear separation between different sections of the application (e.g., Home, About pages).
-   Consistent styling (using global and component-specific CSS).
-   State managed predictably using Zustand, avoiding unnecessary re-renders or side effects (`useEffect` is discouraged).
