import express, { Express, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path'; // Need dirname specifically

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
// Cloud Run provides the port number via the PORT environment variable.
// Default to 8080 if not set (common practice for Cloud Run).
const port: number = parseInt(process.env.PORT || '8080', 10);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public'))); // Keep serving existing public files if needed

// --- New: Serve React App Static Files (Production Only) ---
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist'); // Correct path relative to compiled server.ts
  app.use(express.static(clientBuildPath));

  // --- New: Catch-all for Client-Side Routing (Production Only) ---
  // This should come after API routes and other static file serving
  app.get('*', (_req: Request, res: Response): void => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // Optional: Add a message or default route for development if needed
  app.get('/', (_req: Request, res: Response): void => {
    // In development, Vite handles the root. This is a fallback if accessed directly.
    res.send('Server running in development mode. Access the React app via Vite dev server (usually http://localhost:5173).');
  });
}


app.listen(port, (): void => {
  console.log(`Server running on port ${port}. NODE_ENV=${process.env.NODE_ENV || 'development'}`);
});
