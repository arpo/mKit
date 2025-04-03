// Load environment variables from .env file first!
require('dotenv').config(); // Use require for dotenv

const express = require('express');
const path = require('path');
// __dirname is globally available in CommonJS

// Import the new audio split router
const audioSplitRouter = require('./audio-split/routes.cjs'); // Add .cjs extension
// Import the audio-to-text router
const audioToTextRouter = require('./audio-to-text/routes.cjs');
// Import the gemini router
const geminiRouter = require('./gemini/routes.cjs');

const app = express(); // Remove Express type hint
// Cloud Run provides the port number via the PORT environment variable.
// Default to 8080 if not set (common practice for Cloud Run).
const port = parseInt(process.env.PORT || '8080', 10); // Remove number type hint

// Health check endpoint
app.get('/health', (_req, res) => { // Remove Request, Response types
  res.status(200).json({ status: 'OK' });
});

// --- API Routes ---
// Enable JSON body parsing for API requests
app.use(express.json()); // IMPORTANT: Add this before API routes that expect JSON bodies

// Mount the audio split router
app.use('/api/audio-split', audioSplitRouter);
// Mount the audio-to-text router
app.use('/api/audio-to-text', audioToTextRouter);
// Mount the gemini router
app.use('/api/gemini', geminiRouter);
// Add other API routers here before static file serving

// --- New: Serve React App Static Files (Production Only) ---
// Removed unnecessary static middleware for root /public
if (process.env.NODE_ENV === 'production') {
  // Use absolute path for client build
  // NOTE: This path might need adjustment depending on the final deployment structure
  // If the server runs from /dist, __dirname might be different.
  // But for Cloud Run, the Dockerfile sets WORKDIR /app. Use absolute path directly.
  const clientBuildPath = '/app/client/dist'; // Use absolute path based on WORKDIR
  console.log('Attempting to serve static files from:', clientBuildPath);

  app.use(express.static(clientBuildPath));

  // --- New: Catch-all for Client-Side Routing (Production Only) ---
  // This should come after API routes and other static file serving
  app.get('*', (_req, res) => { // Remove Request, Response types
    // Construct path manually as a test
    const indexPath = clientBuildPath + '/index.html';
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
