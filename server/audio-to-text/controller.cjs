const fal = require("@fal-ai/client");

// Ensure the API token is loaded from environment variables
if (!process.env.FAL_API_TOKEN) {
  console.error("FAL_API_TOKEN environment variable is not set.");
  // In a real application, you might throw an error or handle this differently
}

async function handleTranscriptionRequest(req, res) {
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
    // Note: Authentication is handled automatically by the client library
    // using the FAL_KEY environment variable (or FAL_API_TOKEN)
    const result = await fal.subscribe("fal-ai/wizper", {
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
