'use strict';

const express = require('express');
const multer = require('multer'); // Import multer
const { handleAudioTranscription } = require('./controller.cjs'); // Import the new handler

const router = express.Router();

// Configure multer for memory storage (simple for smaller files)
// For larger files, consider diskStorage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Example limit: 50MB, adjust as needed
});

// Define POST route for handling audio uploads and transcription
// Use multer middleware to handle multipart/form-data and extract the file
// 'audioFile' is the field name expected from the frontend client
router.post('/', upload.single('audioFile'), handleAudioTranscription);

module.exports = router;
