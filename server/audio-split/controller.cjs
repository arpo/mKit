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
    console.log(`Sending prediction request to Replicate (Version: ${spleeterVersion})...`);
    // Use standard replicate instance
    const prediction = await replicate.predictions.create({
      version: spleeterVersion,
      input,
    });

    console.log('Replicate prediction initiated:', prediction.id);
    return prediction;

  } catch (error) {
    console.error('Replicate API error:', error);
    throw new Error('Failed to start audio splitting process with Replicate.');
  }
}

// Use module.exports for CommonJS
module.exports = {
  startSplittingProcess
};
