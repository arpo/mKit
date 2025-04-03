require('dotenv').config();

// Using an async IIFE to handle top-level await for dynamic import
let replicateInstance;
(async () => {
  // Log the token *before* trying to use it
  console.log('[Auth Check] REPLICATE_API_TOKEN from process.env:', process.env.REPLICATE_API_TOKEN ? 'Loaded (length: ' + process.env.REPLICATE_API_TOKEN.length + ')' : 'NOT LOADED');
  try {
    const Replicate = await import('replicate');
    // The replicate library might export the class as default or named
    const ReplicateClient = Replicate.default || Replicate;
    if (!ReplicateClient) {
      throw new Error('Could not import Replicate client correctly.');
    }
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('Error: REPLICATE_API_TOKEN environment variable not set.');
      // Potentially throw an error or handle this case appropriately
      // For now, we allow initialization, but API calls will fail.
    }
    replicateInstance = new ReplicateClient({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    console.log('Replicate client initialized dynamically.');
  } catch (err) {
    console.error('Error dynamically importing or initializing Replicate:', err);
    // Handle initialization error appropriately, maybe exit or set a flag
  }
})();

const splitAudio = async (req, res) => {
  if (!replicateInstance) {
    return res.status(500).json({ error: 'Replicate client not initialized.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }

  try {
    // Convert buffer to Base64 data URI
    const audioBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const base64Audio = audioBuffer.toString('base64');
    const dataURI = `data:${mimeType};base64,${base64Audio}`;

    console.log(`Calling Replicate spleeter model for file: ${req.file.originalname} (${mimeType})`);

    const output = await replicateInstance.run(
      'soykertje/spleeter:cd128044253523c86abfd743dea680c88559ad975ccd72378c8433f067ab5d0a',
      {
        input: {
          audio: dataURI,
          // Add other parameters if needed based on model schema
          // e.g., stems: "vocals", separate_mixed: false
        },
      }
    );

    console.log('Replicate spleeter model finished successfully.');
    res.json(output);

  } catch (error) {
    console.error('Error calling Replicate API:', error);
    // Provide more specific error details if possible
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to process audio with Replicate.';
    res.status(500).json({ error: 'Failed to process audio with Replicate.', details: errorMessage });
  }
};

const getPredictionStatus = async (req, res) => {
  if (!replicateInstance) {
    return res.status(500).json({ error: 'Replicate client not initialized.' });
  }
  if (!req.params.id) {
    return res.status(400).json({ error: 'No prediction ID provided.' });
  }

  try {
    const predictionId = req.params.id;
    console.log(`[Status Check] Fetching status for ID: ${predictionId}`);
    const prediction = await replicateInstance.predictions.get(predictionId);

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found.' });
    }

    console.log(`[Status Check] Status for ${predictionId}: ${prediction.status}`);
    // Return the full prediction object which includes status, logs, output, error, etc.
    res.json(prediction);

  } catch (error) {
    console.error(`Error fetching Replicate prediction status for ID ${req.params.id}:`, error);
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to get prediction status from Replicate.';
    // Determine appropriate status code (e.g., 404 if not found, 500 otherwise)
    const statusCode = error.response?.status === 404 ? 404 : 500;
    res.status(statusCode).json({ error: 'Failed to get prediction status.', details: errorMessage });
  }
};

module.exports = {
  splitAudio,
  getPredictionStatus, // Export the new function
};
