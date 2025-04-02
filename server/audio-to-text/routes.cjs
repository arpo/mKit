const express = require("express");
const { handleTranscriptionRequest } = require("./controller.cjs");

const router = express.Router();

// POST /api/audio-to-text
// Expects a JSON body with 'audio_url' and optional fields
// like 'task', 'language', 'chunk_level', 'version'
router.post("/", handleTranscriptionRequest);

module.exports = router;
