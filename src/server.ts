import express, { Express, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
// Cloud Run provides the port number via the PORT environment variable.
// Default to 8080 if not set (common practice for Cloud Run).
const port: number = parseInt(process.env.PORT || '8080', 10);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public'))); // Use absolute path for safety

// Route for the home page
app.get('/', (_req: Request, res: Response): void => {
  // Explicitly serve index.html for the root path
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, (): void => {
  console.log(`Server running on port ${port}`);
});
