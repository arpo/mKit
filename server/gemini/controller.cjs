'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure GEMINI_API_KEY is loaded from .env (handled in server.cjs)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable not set.');
  // In a real app, you might throw an error or handle this differently
}

let genAI;
let model;

// Initialize only if API key is available
if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      // Using 1.5 Flash as a starting point, can be adjusted
      model: 'gemini-1.5-flash',
    });
  } catch (error) {
    console.error('Error initializing GoogleGenerativeAI:', error);
    // Prevent the app from crashing if initialization fails, but log the error
  }
}

const generationConfig = {
  temperature: 0.9, // Adjusted for slightly more predictable output initially
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

const handleGeminiPrompt = async (req, res) => {
  if (!model) {
    return res.status(500).json({ error: 'Gemini AI model not initialized. Check API Key.' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid "prompt" in request body.' });
  }

  console.log('Received Gemini prompt:', prompt); // Log received prompt

  try {
    const chatSession = model.startChat({
      generationConfig,
      // history: [], // Start new chat each time for simplicity
    });

    const result = await chatSession.sendMessage(prompt);
    const responseText = result.response.text();

    console.log('Gemini response received.'); // Log success
    res.json({ result: responseText });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // Provide a generic error message to the client
    res.status(500).json({ error: 'Failed to get response from Gemini API.', details: error.message });
  }
};

module.exports = {
  handleGeminiPrompt,
};
