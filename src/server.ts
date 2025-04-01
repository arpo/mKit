import express, { Express, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const port: number = 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route for the home page
app.get('/', (_req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, (): void => {
  console.log(`Server running at http://localhost:${port}`);
});