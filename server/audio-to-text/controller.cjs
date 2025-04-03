// Ensure the API token is loaded from environment variables
// Note: @fal-ai/client will be dynamically imported below
if (!process.env.FAL_API_TOKEN) {
  console.error("FAL_API_TOKEN environment variable is not set.");
  // In a real application, you might throw an error or handle this differently
}


async function handleTranscriptionRequest(req, res) {
  // Log the environment variables as seen by the function
  console.log(`[Fal AI Token Check] process.env.FAL_API_TOKEN: ${process.env.FAL_API_TOKEN ? 'SET' : 'NOT SET'}`);
  console.log(`[Fal AI Token Check] process.env.FAL_KEY: ${process.env.FAL_KEY ? 'SET' : 'NOT SET'}`);
  const falCredentials = process.env.FAL_KEY || process.env.FAL_API_TOKEN; // Prioritize FAL_KEY
  console.log(`[Fal AI Token Check] Using credentials from env var: ${falCredentials ? 'SET' : 'NOT SET'}`);

  const {
    audio_url,
    task = "transcribe", // Default task
    language = "en", // Default language
    chunk_level = "segment", // Default chunk level
    version = "3" // Default version
  } = req.body;

  if (!audio_url) {
    return res.status(400).json({ error: "Missing required field: audio_url" });
  }

  console.log(`[Fal AI Wizper] Request received for audio_url: ${audio_url}`);

  try {
    // Dynamically import the @fal-ai/serverless-client library
    const falModule = await import('@fal-ai/serverless-client');

    // Explicitly configure credentials using FAL_KEY or FAL_API_TOKEN
    const configFunc = falModule.config || falModule.default?.config;
    if (typeof configFunc === 'function' && falCredentials) {
        console.log("[Fal AI Config] Attempting explicit configuration using detected credentials.");
        configFunc({ credentials: falCredentials });
    } else if (!falCredentials) {
        console.warn("[Fal AI Config] No Fal credentials found in env for explicit configuration.");
    } else {
        console.warn("[Fal AI Config] config function not found on falModule or falModule.default.");
    }

    // Determine the correct subscribe function (handles ESM/CJS interop)
    const subscribeFunc = falModule.subscribe || falModule.default?.subscribe;

    if (typeof subscribeFunc !== 'function') {
      console.error("[Fal AI Wizper] Critical error: subscribe function not found in @fal-ai/serverless-client module.");
      throw new Error('Fal AI client initialization failed.');
    }

    // Note: Authentication *should* now be handled by the explicit config above,
    // or automatically by the library checking FAL_KEY / FAL_API_TOKEN if explicit config fails/doesn't exist.
    const result = await subscribeFunc("fal-ai/wizper", {
      input: {
        audio_url,
        task,
        language,
        chunk_level,
        version,
      },
      logs: true, // Enable logs for debugging during subscription
      onQueueUpdate: (update) => {
        // Optional: Log progress updates if needed
        if (update.status === "IN_PROGRESS") {
          console.log("[Fal AI Wizper] Transcription in progress...");
          // update.logs.map((log) => log.message).forEach(console.log); // Uncomment for detailed logs
        } else if (update.status === "COMPLETED") {
           console.log("[Fal AI Wizper] Transcription completed.");
        }
      },
    });

    console.log(`[Fal AI Wizper] Success. Request ID: ${result.requestId}`);
    // The actual transcription data should be in result.data or similar based on Fal AI's structure
    // Assuming the structure from the example:
    res.status(200).json(result.data || result); // Send back the result data

  } catch (error) {
    console.error("[Fal AI Wizper] Error during transcription:", error);
    res.status(500).json({ error: "Failed to process audio transcription", details: error.message });
  }
}

module.exports = {
  handleTranscriptionRequest,
};
