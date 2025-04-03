const express = require('express');
const multer = require('multer');
// Import both controller functions
const { splitAudio, getPredictionStatus } = require('./controller.cjs'); 

const router = express.Router();

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Optional: Limit file size (e.g., 50MB)
});

// Define the POST route for audio splitting
// It expects a form-data field named 'audioFile'
router.post('/', upload.single('audioFile'), splitAudio);

// Define the GET route for checking prediction status
router.get('/status/:id', getPredictionStatus);

module.exports = router;
