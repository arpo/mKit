// Use require for JavaScript modules
const Replicate = require('replicate');

// Ensure the API token is loaded (dotenv should be configured in server.js)
if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error('REPLICATE_API_TOKEN is not set in environment variables.');
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Replicate Spleeter model version
const spleeterVersion = "cd128044253523c86abfd743dea680c88559ad975ccd72378c8433f067ab5d0a";

/**
 * Converts a file buffer and mimetype into a base64 data URI.
 */
function bufferToDataURI(buffer, mimeType) { // Removed Buffer, string types
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Starts the audio splitting process on Replicate.
 * @param req - The Express request object containing the uploaded file.
 * @returns The initial prediction object from Replicate.
 * @throws If no file is uploaded or if the Replicate API call fails.
 */
async function startSplittingProcess(req) { // Removed Request type
  if (!req.file) {
    throw new Error('No audio file uploaded.');
  }

  console.log(`Processing file: ${req.file.originalname}, Size: ${req.file.size}, MIME: ${req.file.mimetype}`);

  // Convert the buffer to a data URI
  const audioDataURI = bufferToDataURI(req.file.buffer, req.file.mimetype);

  const input = {
    audio: audioDataURI,
    // Add other parameters if needed by the model, e.g., stems: 'vocals/drums/bass/other'
  };

  try {
    console.log(`[Controller] Sending prediction request to Replicate (Version: ${spleeterVersion})...`);
    console.log('[Controller] Input configuration:', { ...input, audio: '[DATA_URI_HIDDEN]' });

    // Use standard replicate instance
    const prediction = await replicate.predictions.create({
      version: spleeterVersion,
      input,
    });

    console.log('[Controller] Replicate response:', {
      id: prediction.id,
      status: prediction.status,
      created_at: prediction.created_at,
      model: prediction.version,
    });

    if (!prediction.id) {
      console.error('[Controller] No prediction ID in response');
      throw new Error('Invalid response from Replicate: missing prediction ID');
    }

    // Ensure we're returning the expected format
    const response = {
      id: prediction.id,
      status: prediction.status || 'starting',
      created_at: prediction.created_at
    };

    console.log('[Controller] Returning prediction:', response);
    return response;

  } catch (error) {
    console.error('[Controller] Replicate API error:', error);
    throw new Error(`Failed to start audio splitting: ${error.message}`);
  }
}

/**
 * Gets the status and result of a prediction from Replicate.
 * @param predictionId - The ID of the prediction to fetch.
 * @returns The prediction object from Replicate.
 * @throws If the Replicate API call fails.
 */
async function getPredictionStatus(predictionId) {
  console.log(`[Controller] Fetching status for prediction ID: ${predictionId}...`);
  
  if (!predictionId) {
    console.error('[Controller] Invalid prediction ID received');
    throw new Error('Invalid prediction ID');
  }

  try {
    console.log(`[Controller] Making API call to Replicate for ID: ${predictionId}`);
    const prediction = await replicate.predictions.get(predictionId);
    
    console.log('[Controller] Received prediction:', {
      id: prediction.id,
      status: prediction.status,
      created_at: prediction.created_at,
      completed_at: prediction.completed_at,
      // Log other relevant fields but avoid sensitive data
    });

    if (!prediction.status) {
      console.error('[Controller] No status in prediction response');
      throw new Error('Invalid prediction response from Replicate');
    }

    return prediction;
  } catch (error) {
    console.error(`[Controller] Replicate API error for ${predictionId}:`, error);
    // Check for specific error types
    if (error.response?.status === 404) {
      throw new Error(`Prediction ${predictionId} not found`);
    }
    throw new Error(`Failed to get prediction status: ${error.message}`);
  }
}


// Use module.exports for CommonJS
module.exports = {
  startSplittingProcess,
  getPredictionStatus
};
