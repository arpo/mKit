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

// Define the POST route for starting the audio split
router.post('/', upload.single('audio'), async (req, res, next) => { // Remove type annotations
  try {
    console.log('Received request on /api/audio-split');
    const prediction = await startSplittingProcess(req);

    res.status(202).json(prediction); // 202 Accepted
  } catch (error) {
    console.error('Error in /api/audio-split route:', error);
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
