'use strict';

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Ensure GEMINI_API_KEY is loaded from .env (handled in server.cjs)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable not set.');
  // In a real app, you might throw an error or handle this differently
}

let genAI;
let model;
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH, // Adjust threshold as needed
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
   {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, // Might need adjustment for lyrics
  },
   {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];


// Initialize only if API key is available
if (apiKey) {
  try {
    // Try gemini-1.5-flash specifically
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash', // Using specific version instead of latest
       safetySettings // Apply safety settings during initialization
    });
    console.log("Gemini AI model 'gemini-1.5-flash' initialized successfully.");
  } catch (error) {
    console.error('Error initializing GoogleGenerativeAI:', error);
    // Log specific error if available, otherwise generic message
    console.error(error.message || 'Failed to initialize Gemini model.');
  }
} else {
  console.error('GEMINI_API_KEY not found. Gemini functionality will be unavailable.');
}

const handleAudioTranscription = async (req, res) => {
  // Check if the model was initialized correctly
  if (!model) {
    console.error('Error: Gemini model not initialized.');
    return res.status(500).json({ error: 'Gemini AI model not initialized. Check API Key and server logs.' });
  }

  // Check if a file was uploaded by multer
  if (!req.file) {
    console.error('Error: No audio file uploaded.');
    return res.status(400).json({ error: 'Missing audio file in request.' });
  }

  console.log('Received audio file:', req.file.originalname, 'Size:', req.file.size, 'MIME Type:', req.file.mimetype);

  // Basic MIME type validation (consider expanding if needed)
  if (!req.file.mimetype.startsWith('audio/')) {
       console.error('Error: Uploaded file is not an audio type:', req.file.mimetype);
       return res.status(400).json({ error: `Invalid file type: ${req.file.mimetype}. Please upload an audio file.` });
   }

  // --- Multimodal Request ---
  const textPrompt = "Transcribe this audio to a song lyric, Formate it to look like a lyric. Dont include sections like [verse] [chorus]";
  const audioDataPart = {
    inlineData: {
      mimeType: req.file.mimetype,
      data: req.file.buffer.toString('base64'), // Convert buffer to base64
    },
  };

  const requestPayload = {
    contents: [
      // Structure for multimodal input: text prompt followed by audio data
      { role: 'user', parts: [{ text: textPrompt }, audioDataPart] }
    ],
    generationConfig: { // Keep generationConfig specific to the request if needed
       temperature: 0.7, // Adjust temperature for creativity/accuracy balance
       // topP: 0.95, // Often defaults are fine
       // topK: 40, // Often defaults are fine
       // maxOutputTokens: 8192, // Default is often sufficient, adjust if needed
       // responseMimeType: 'text/plain', // Implicitly text/plain for text generation
    },
    safetySettings // Apply safety settings to the request
  };

  try {
    console.log(`Sending request to Gemini API (Model: gemini-1.5-pro)...`);
    const result = await model.generateContent(requestPayload);
    // console.log('Raw Gemini Response:', JSON.stringify(result, null, 2)); // Uncomment for deep debugging

    // Robust handling of API response
    const response = result?.response;
    const candidates = response?.candidates;

    // Check for explicit error in response payload
    if (response?.promptFeedback?.blockReason) {
      console.warn(`Request blocked due to prompt feedback: ${response.promptFeedback.blockReason}`);
      return res.status(400).json({ error: `Request blocked: ${response.promptFeedback.blockReason}` });
    }

    if (!candidates || candidates.length === 0) {
      console.error('Error: No candidates returned from Gemini API.');
      console.error('Full Gemini Response:', JSON.stringify(response, null, 2));
      return res.status(500).json({ error: 'No response received from Gemini API.' });
    }

    const candidate = candidates[0];

    // Check for safety ratings leading to finishReason 'SAFETY' or others
    if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
        // Consider MAX_TOKENS a potential success case if content exists, but flag others
        console.warn(`Gemini generation finished unexpectedly: ${candidate.finishReason}`, JSON.stringify(candidate.safetyRatings));
        // Optionally return a more specific error based on finishReason
        return res.status(500).json({ error: `Gemini processing finished unexpectedly: ${candidate.finishReason}` });
    }

    // Extract text content
    let responseText = '';
    if (candidate.content && Array.isArray(candidate.content.parts)) {
      const textPart = candidate.content.parts.find(part => 'text' in part);
      if (textPart) {
        responseText = textPart.text;
      }
    } else if (candidate.content?.text) { // Fallback for simpler structures
        responseText = candidate.content.text;
    }


    if (!responseText) {
        // This might happen if the response was blocked for safety reasons that didn't set finishReason='SAFETY'
        console.error('Error: Empty response text from Gemini API, potentially blocked.');
        console.error('Full Gemini Response:', JSON.stringify(result, null, 2));
        // Check safetyRatings for clues
        const safetyInfo = candidate.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ') || 'No safety ratings available.';
        return res.status(500).json({ error: `Received empty response from Gemini API. Safety info: ${safetyInfo}`});
    }

    console.log('Gemini transcription successful.');
    // Clean potential markdown or unwanted characters
    const cleanedText = responseText.trim().replace(/^```|```$/g, '').trim();
    res.json({ lyrics: cleanedText });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // Log more details if available
    const errorMessage = error.message || 'An unknown error occurred during API call.';
    const errorDetails = error.response ? JSON.stringify(error.response) : (error.cause || 'No additional details');
    console.error('Gemini API Error Details:', errorDetails);
     if (errorMessage.includes('API key not valid') || (error.status === 403 || error.status === 401) ) {
         return res.status(401).json({ error: 'Invalid Gemini API Key or permissions issue.' });
     } else if (error.status === 503 || errorMessage.includes('Service Unavailable')) {
         return res.status(503).json({ error: 'Gemini service is temporarily unavailable or overloaded. Please try again later.' });
     } else if (error.status === 429) {
         return res.status(429).json({ error: 'Gemini API quota exceeded. Please check your usage.' });
     }
    // Generic error for other issues
    res.status(500).json({ error: `Failed to process audio with Gemini API: ${errorMessage}` });
  }
};

// Export the handler
module.exports = {
  handleAudioTranscription,
};
