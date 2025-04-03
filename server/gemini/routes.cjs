'use strict';

const express = require('express');
const { handleGeminiPrompt } = require('./controller.cjs');

const router = express.Router();

// Define POST route for sending prompts to Gemini
// Path is relative to where this router is mounted (e.g., /api/gemini)
router.post('/', handleGeminiPrompt);

module.exports = router;
