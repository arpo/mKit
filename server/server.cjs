// Load environment variables from .env file first!
require('dotenv').config(); // Use require for dotenv

const express = require('express');
const path = require('path');
// __dirname is globally available in CommonJS

// Import the new audio split router
const audioSplitRouter = require('./audio-split/routes.cjs'); // Add .cjs extension

const app = express(); // Remove Express type hint
// Cloud Run provides the port number via the PORT environment variable.
// Default to 8080 if not set (common practice for Cloud Run).
const port = parseInt(process.env.PORT || '8080', 10); // Remove number type hint

// Health check endpoint
app.get('/health', (_req, res) => { // Remove Request, Response types
  res.status(200).json({ status: 'OK' });
});

// --- API Routes ---
// Mount the audio split router
app.use('/api/audio-split', audioSplitRouter);
// Add other API routers here before static file serving

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public'))); // Keep serving existing public files if needed

// --- New: Serve React App Static Files (Production Only) ---
if (process.env.NODE_ENV === 'production') {
  // Use absolute path for client build
  // NOTE: This path might need adjustment depending on the final deployment structure
  // If the server runs from /dist, __dirname might be different.
  // But for Cloud Run, the Dockerfile usually sets WORKDIR /app,
  // so /app/client/dist should be correct relative to the container root.
  const clientBuildPath = path.resolve(__dirname, '../../client/dist'); // Try resolving relative to server.js location
  console.log('Attempting to serve static files from:', clientBuildPath);

  app.use(express.static(clientBuildPath));

  // --- New: Catch-all for Client-Side Routing (Production Only) ---
  // This should come after API routes and other static file serving
  app.get('*', (_req, res) => { // Remove Request, Response types
    const indexPath = path.join(clientBuildPath, 'index.html');
    console.log('Serving index from:', indexPath);
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error("Error sending index.html:", err);
        res.status(500).send("Error serving application.");
      }
    });
  });
} else {
  // Optional: Add a message or default route for development if needed
  app.get('/', (_req, res) => { // Remove Request, Response types
    // In development, Vite handles the root. This is a fallback if accessed directly.
    res.send('Server running in development mode. Access the React app via Vite dev server (usually http://localhost:5173).');
  });
}

app.listen(port, () => { // Remove void type hint
  console.log(`Server running on port ${port}. NODE_ENV=${process.env.NODE_ENV || 'development'}`);
});
