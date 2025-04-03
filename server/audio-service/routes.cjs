const express = require('express');
const multer = require('multer');
// Import both functions from controller now
const { startSplittingProcess, getPredictionStatus } = require('./controller.cjs');

const router = express.Router();

// Configure Multer for single file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB limit
});

// Define the POST route for starting the audio processing
router.post('/', upload.single('audio'), async (req, res, next) => { // Remove type annotations
  try {
    // Extract service from query parameters, default to 'falai'
    let service = req.query.service;
    if (service !== 'falai' && service !== 'demucs') {
      console.warn(`Invalid or missing service query parameter: "${service}". Defaulting to 'falai'.`);
      service = 'falai'; // Default service
    }
    console.log(`Received request on /api/audio-service with service: ${service}`);

    // Pass both req and service to the controller function
    const result = await startSplittingProcess(req, service);

    // Check the response type flag from the controller
    if (result._serviceResponseType === 'direct') {
      // Demucs finished via replicate.run, return 200 OK with the direct output
      console.log(`[Routes] Sending direct result (200 OK) for service: ${service}`);
      // Remove the internal flag before sending to client
      const { _serviceResponseType, ...clientResult } = result;
      res.status(200).json(clientResult);
    } else {
      // Fal AI needs polling, return 202 Accepted with prediction details
      console.log(`[Routes] Sending polling info (202 Accepted) for service: ${service}`);
      // Remove the internal flag before sending to client
      const { _serviceResponseType, ...clientResult } = result;
      res.status(202).json(clientResult);
    }

  } catch (error) {
    // Ensure the service context is included in the error log
    const requestedService = req.query.service || 'default (falai)';
    console.error(`Error in /api/audio-service route (service: ${requestedService}):`, error);
    if (error instanceof Error) {
        res.status(500).json({ message: error.message || 'Failed to process audio split request.' });
    } else {
        res.status(500).json({ message: 'An unknown error occurred.' });
    }
    // Consider calling next(error) if you have a dedicated error handler middleware
  }
});

// Route for checking prediction status
router.get('/status/:id', async (req, res, next) => {
  try {
    const predictionId = req.params.id;
    if (!predictionId) {
      return res.status(400).json({ message: 'Prediction ID is required.' });
    }
    console.log(`Received status check request for ID: ${predictionId}`);
    const predictionStatus = await getPredictionStatus(predictionId);
    res.status(200).json(predictionStatus);
  } catch (error) {
    console.error(`Error checking status for ID: ${req.params.id}`, error);
     if (error instanceof Error) {
        res.status(500).json({ message: error.message || 'Failed to get prediction status.' });
    } else {
        res.status(500).json({ message: 'An unknown error occurred while checking status.' });
    }
  }
});

module.exports = router; // Use module.exports
