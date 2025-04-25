'use strict';

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Ensure GEMINI_API_KEY is loaded from .env (handled in server.cjs)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable not set.');
  // In a real app, you might throw an error or handle this differently
}

// Define safety settings: Blocking turned off for all categories
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
   {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
   {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];


let genAI;
let model;

// Initialize only if API key is available
if (apiKey) {
  try {
    // Initialize Gemini client (using gemini-1.5-pro as per previous step)
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro', // Keep gemini-1.5-pro for now
      safetySettings // Apply safety settings during model initialization
    });
    console.log("Gemini AI model 'gemini-1.5-pro' initialized successfully with BLOCK_NONE safety settings.");
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
  const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4'];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
       console.error('Error: Unsupported file type:', req.file.mimetype);
       return res.status(400).json({ error: `Unsupported file type: ${req.file.mimetype}. Please upload audio (e.g., MP3, WAV, OGG, FLAC).` });
   }

  // Extract language from the request body
  const language = req.body.language;
  // console.log('Received language:', language);

  // --- Multimodal Request ---
  const textPrompt = `
Transcribe this audio to a song lyric,
Formate it to look like a lyric, add timestamps for each line.
Don't include sections like [verse] [chorus]${!language ? '' : `\n\nLanguage: ${language}`}

example of the format:
[00:00:00] Can it ever be enough
[00:00:03] When I look in the mirror
[00:00:06] There's a light that I lost
`;
// Also return style and vibe of the song.

// Also return a detailed text prompt how an album cover would look like. use view of the singer and the lyrics. Important to include what type image it is, like a painting, a photo, a digital art, etc. Don't include any text in the prompt.

// Return the text in a code block.

  // console.log('Using text prompt:', textPrompt);

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
    safetySettings, // Apply safety settings to the request
    generationConfig: {
       temperature: 0.7,
    },
  };

  try {
    // Explicitly specify the model in the generateContent call as well
    console.log(`Sending request to Gemini API (Model specified in options: gemini-1.5-pro)...`);
    const result = await model.generateContent(
        requestPayload,
        { // Add generation options explicitly here too
            model: 'gemini-1.5-pro' // Explicitly ensure the pro model is used for this request
        }
    );
    // console.log('Raw Gemini Response:', JSON.stringify(result, null, 2)); // Uncomment for deep debugging

    // --- Consolidated Response Handling ---
    const response = result?.response;
    const promptFeedback = response?.promptFeedback;
    if (promptFeedback?.blockReason) {
      console.warn(`Request blocked due to prompt feedback: ${promptFeedback.blockReason}`);
      const safetyRatings = promptFeedback.safetyRatings?.map(rating => `${rating.category}: ${rating.probability}`).join(', ') || 'No specific safety rating details.';
      return res.status(400).json({ error: `Request blocked by safety filter (${promptFeedback.blockReason}). Details: ${safetyRatings}` });
    }

    if (!response?.candidates || response.candidates.length === 0) {
      console.error('Error: No candidates returned from Gemini API.');
      console.error('Full Gemini Response:', JSON.stringify(response, null, 2)); // Log the response part
      const finishReason = response?.finishReason || 'UNKNOWN';
      return res.status(500).json({ error: `No candidates received from Gemini API. Finish reason: ${finishReason}.` });
    }

    const candidate = response.candidates[0];
    const finishReason = candidate.finishReason;
    if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
        console.warn(`Gemini generation finished unexpectedly: ${finishReason}`, JSON.stringify(candidate.safetyRatings || 'No safety details'));
        const safetyInfo = candidate.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ') || 'No specific safety rating details.';
        // Return specific status if it was a safety block
        if (finishReason === 'SAFETY') {
             return res.status(400).json({ error: `Content blocked by safety filter. Reason: ${finishReason}. Safety info: ${safetyInfo}` });
        }
         // Corrected variable name from 'message' to 'finishReason' for the generic error case
         return res.status(500).json({ error: `Gemini processing stopped: ${finishReason}. Safety info: ${safetyInfo}` });
    }

    // Handle empty content cases after successful generation
    let responseText = '';
    if (candidate.content?.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
      const textPart = candidate.content.parts.find(part => typeof part.text === 'string');
      if (textPart) {
        responseText = textPart.text;
      }
    } else if (typeof candidate.content?.text === 'string') { // Fallback for models that might not use 'parts'
        responseText = candidate.content.text;
    }


    // If responseText is still empty even if finishReason is STOP, it indicates an issue.
    if (!responseText && (finishReason === 'STOP' || finishReason === 'MAX_TOKENS')) {
        console.error('Error: Empty text content received from Gemini API despite successful generation.');
        console.error('Full Candidate:', JSON.stringify(candidate, null, 2)); // Log the candidate details
        return res.status(500).json({ error: 'Received empty response text from Gemini API.' });
    } else if (!responseText) { // Handle cases where finishReason might be missing or UNKNOWN
         console.error('Error: Empty response text and potentially incomplete generation.');
         console.error('Full Candidate:', JSON.stringify(candidate, null, 2));
         return res.status(500).json({ error: 'Received empty or incomplete response from Gemini API.' });
     }

    // Success path: Clean and return the response text
    console.log('Gemini transcription successful.');
    const cleanedText = responseText.trim().replace(/^```|```$/g, '').trim();
    res.json({ lyrics: cleanedText });

  } catch (error) {
    // Handle network errors or other exceptions during API call
    console.error('Error calling Gemini API:', error);
    const statusCode = error.status || error.statusCode || 500;
    const message = error.message || 'An unknown error occurred.';
     console.error('Gemini API Error Details:', error);

     if (statusCode === 400 && message.includes('API key not valid')) {
         return res.status(401).json({ error: 'Invalid Gemini API Key.' });
     } else if (statusCode === 429 || message.includes('quota')) {
         return res.status(429).json({ error: 'Gemini API quota exceeded. Please check your usage.'});
     } else if (statusCode === 503 || message.includes('Service Unavailable') || message.includes('overloaded')) {
         return res.status(503).json({ error: 'Gemini service is temporarily unavailable or overloaded. Please try again later.' });
     } else if (statusCode === 400 && message.includes('Unsupported language')) {
          return res.status(400).json({ error: 'Unsupported language in audio file.' });
      } else if (statusCode === 400 && (message.includes('Invalid argument') || message.includes('invalid format'))) {
          return res.status(400).json({ error: `Invalid request: ${message}. Check file format and parameters.` });
      }
    // Generic error for other issues
    res.status(500).json({ error: `Failed to process audio due to an internal error: ${message}` });
  }
};

// Export the handler
module.exports = {
  handleAudioTranscription,
};
