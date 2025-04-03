// Use require for JavaScript modules
const Replicate = require('replicate');

// Ensure the API token is loaded (dotenv should be configured in server.js)
if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error('REPLICATE_API_TOKEN is not set in environment variables.');
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Replicate model versions and configurations
const spleeterVersion = "cd128044253523c86abfd743dea680c88559ad975ccd72378c8433f067ab5d0a";
// Use ONLY the hash for the predictions.create API
const demucsVersionHash = "5a7041cc9b82e5a558fea6b3d7b12dea89625e89da33f0447bd727c2d0ab9e77";

// Input config matching the confirmed playground example
const demucsInputConfig = {
  jobs: 0,                // Default
  stem: "none",           // Required when splitting all stems
  model: "htdemucs",      // Base model
  split: true,            // MUST be true to get separate stems
  shifts: 1,              // Default
  overlap: 0.25,          // Default
  // segment: 0,          // Omitting 'segment' as it's often default/optional
  clip_mode: "rescale",   // Default
  mp3_preset: 2,          // Default quality/speed balance
  wav_format: "int24",    // Used internally by model before mp3 encoding
  mp3_bitrate: 320,       // High quality
  output_format: "mp3"    // Final output format
};

/**
 * Converts a file buffer and mimetype into a base64 data URI.
 */
function bufferToDataURI(buffer, mimeType) { // Removed Buffer, string types
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Starts the audio processing (splitting or vocal isolation) process on Replicate.
 * @param req - The Express request object containing the uploaded file.
 * @param service - The service to use ('falai' for Spleeter, 'demucs' for Demucs).
 * @returns The initial prediction object from Replicate.
 * @throws If no file is uploaded, the service is invalid, or the Replicate API call fails.
 */
async function startSplittingProcess(req, service) {
  if (!req.file) {
    throw new Error('No audio file uploaded.');
  }
  if (service !== 'falai' && service !== 'demucs') {
    throw new Error(`Invalid service specified: ${service}. Must be 'falai' or 'demucs'.`);
  }

  console.log(`Processing file: ${req.file.originalname}, Size: ${req.file.size}, MIME: ${req.file.mimetype}`);

  // Convert the buffer to a data URI
  const audioDataURI = bufferToDataURI(req.file.buffer, req.file.mimetype);

  let version;
  let input;

  if (service === 'falai') {
    version = spleeterVersion;
    input = {
      audio: audioDataURI,
      // Fal AI Spleeter doesn't have many configurable options here
    };
    console.log(`[Controller] Using Fal AI (Spleeter) service. Version: ${version}`);
  } else { // service === 'demucs'
    // Use the HASH for predictions.create, not the full string
    version = demucsVersionHash;
    input = {
      ...demucsInputConfig, // Use the playground-confirmed config
      audio: audioDataURI,  // Add the audio data
    };
    console.log(`[Controller] Using Demucs service. Version: ${version}`);
  }

  // --- Main API Call Logic ---
  try {
    // ALWAYS use predictions.create for both services now
    console.log(`[Controller/${service}] Using predictions.create (Polling)...`);
    // Version and input are now correctly set above based on service
    console.log(`[Controller/${service}] Version: ${version}`); // Log the version being used (hash for demucs)
    console.log(`[Controller/${service}] Input configuration:`, { ...input, audio: '[DATA_URI_HIDDEN]' });

    const prediction = await replicate.predictions.create({
        version: version, // Use the correctly assigned version (hash for demucs)
        input: input, // Use service-specific input
      });

    console.log(`[Controller/${service}] Prediction Created Response:`, {
        id: prediction.id,
        status: prediction.status,
        created_at: prediction.created_at,
        model: prediction.version,
      });

      if (!prediction.id) {
        console.error(`[Controller/${service}] No prediction ID in response`);
        throw new Error(`Invalid response from Replicate (${service}): missing prediction ID`);
      }

      // Return structure for polling
      return {
        id: prediction.id,
        status: prediction.status || 'starting',
        created_at: prediction.created_at,
        _serviceResponseType: 'polling' // Flag indicates polling is needed
      };

    // No more replicate.run logic needed here

  } catch (error) {
     // Log the error with service context
    console.error(`[Controller/${service}] Replicate API Error Object:`, error);
    // Attempt to log the detailed error response body from Replicate
    if (error.response && typeof error.response.json === 'function') {
      try {
        const errorDetails = await error.response.json();
        console.error(`[Controller/${service}] Detailed Replicate Error Response:`, JSON.stringify(errorDetails, null, 2));
      } catch (parseError) {
        console.error(`[Controller/${service}] Could not parse detailed error response.`);
      }
    }
    // Construct a standard error message
    const errorMessage = error instanceof Error ? error.message : 'An unknown Replicate API error occurred';
    throw new Error(`Failed to start audio processing with ${service}: ${errorMessage}`);
  }
}

/**
  }
  if (service !== 'falai' && service !== 'demucs') {
    throw new Error(`Invalid service specified: ${service}. Must be 'falai' or 'demucs'.`);
  }

  console.log(`Processing file: ${req.file.originalname}, Size: ${req.file.size}, MIME: ${req.file.mimetype}`);

  // Convert the buffer to a data URI
  const audioDataURI = bufferToDataURI(req.file.buffer, req.file.mimetype);

  let version;
  let input;

  if (service === 'falai') {
    version = spleeterVersion;
    input = {
      audio: audioDataURI,
      // Fal AI Spleeter doesn't have many configurable options here
    };
    console.log(`[Controller] Using Fal AI (Spleeter) service. Version: ${version}`);
  } else { // service === 'demucs'
    version = demucsVersion; // Use the full identifier string
    input = {
      ...demucsInputConfig, // Spread the predefined Demucs config
      audio: audioDataURI,  // Add the audio data
    };
    console.log(`[Controller] Using Demucs service. Version: ${version}`);
    };

    console.log(`[Controller/${service}] Returning prediction:`, response);
    return response;

  } catch (error) {
    console.error(`[Controller/${service}] Replicate API error:`, error);
    throw new Error(`Failed to start audio processing with ${service}: ${error.message}`);
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
