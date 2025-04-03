import { create } from 'zustand';
import { useDropAreaStore } from '../../components/DropArea/Script';

// Keep track of the polling interval outside the store state if needed,
// or manage it within an effect inside the store if using middleware.
// For simplicity here, we manage it via actions.
let pollingIntervalId: number | null = null;
const MAX_PROCESSING_TIME_MS = 6 * 60 * 1000; // 6 minutes timeout

export interface HomeState {
  isLoading: boolean;
  predictionId: string | null;
  predictionStatus: string | null; // e.g., 'starting', 'processing', 'succeeded', 'failed'
  finalResult: Record<string, string> | null; // Structure for successful output
  error: string | null;
  progress: { // New state for detailed progress
    percentage: number;
    message: string;
    logs: string[];
  };
  predictionStartTime: number | null; // Timestamp when polling started
  selectedAudioService: 'falai' | 'demucs'; // New: Service selection

  // Transcription State
  isTranscribing: boolean;
  rawTranscriptionResult: string | null; // Renamed for clarity, stores raw text
  transcriptionError: string | null;

  // Formatting State (New)
  isFormatting: boolean;
  formattedTranscription: string | null; // Stores Gemini formatted result
  formattingError: string | null;

  // Actions
  setAudioService: (service: 'falai' | 'demucs') => void; // New: Action to set service
  uploadAudioAndStartPolling: () => Promise<void>;
  startTranscription: (audioUrl: string) => Promise<void>; // Keep only one declaration
  formatTranscription: (textToFormat: string) => Promise<void>; // New action
  clearPrediction: () => void;
  checkPredictionStatus: () => Promise<void>; // Made explicit action
  stopPolling: () => void; // Explicit action to stop
}

// --- Helper Functions ---

// Tries to parse progress percentage from Replicate logs
const parseProgress = (logs: string | null | undefined): number => {
  if (!logs) return 0;
  // Look for lines like "INFO:spleeter:Progress: 25.3 %" or similar patterns. Adjust regex as needed.
  // This regex captures a number (integer or float) followed by optional space and '%'
  const progressMatches = logs.match(/Progress:\s*(\d+(\.\d+)?)\s*%/g);
  if (progressMatches && progressMatches.length > 0) {
    // Get the last match in case logs update progress multiple times
    const lastMatch = progressMatches[progressMatches.length - 1];
    const percentageMatch = lastMatch.match(/(\d+(\.\d+)?)/);
    if (percentageMatch && percentageMatch[1]) {
      const percentage = parseFloat(percentageMatch[1]);
      console.log(`[Progress Parsing] Found percentage: ${percentage}`);
      // Cap progress at 100, handle potential edge cases
      return Math.min(100, Math.max(0, Math.round(percentage)));
    }
  }
  console.log("[Progress Parsing] No percentage found in logs.");
  return 0; // Default to 0 if no progress line found
};


// Map Replicate status codes to user-friendly messages
const statusMessages: { [key: string]: string } = {
  starting: 'Booting up system (1-4 min)...',
  processing: 'Processing audio tracks...',
  succeeded: 'Processing complete!',
  failed: 'Processing failed.',
  canceled: 'Processing canceled.',
  uploading: 'Uploading audio file...', // Added for consistency
  // Add other potential Replicate statuses if observed
};

// --- Zustand Store Definition ---

export const useHomeStore = create<HomeState>((set, get) => ({
  // Initial state
  isLoading: useDropAreaStore.getState().isLoading,
  predictionId: useDropAreaStore.getState().predictionId,
  predictionStatus: null,
  finalResult: null,
  error: useDropAreaStore.getState().error,
  progress: { // Initialize progress state
    percentage: 0,
    message: '',
    logs: [],
  },
  predictionStartTime: null, // Initialize the new state field
  selectedAudioService: 'demucs', // Default to Demucs

  // Transcription State Initialization
  isTranscribing: false,
  rawTranscriptionResult: null, // Renamed
  transcriptionError: null,

  // Formatting State Initialization (New)
  isFormatting: false,
  formattedTranscription: null,
  formattingError: null,

  setAudioService: (service) => {
    if (service === 'falai' || service === 'demucs') {
      set({ selectedAudioService: service });
      console.log(`[Audio Service] Set to: ${service}`);
    } else {
      console.warn(`[Audio Service] Invalid service selected: ${service}`);
    }
  },

  stopPolling: () => {
    if (pollingIntervalId) {
      console.log(`[Polling] Clearing interval ID: ${pollingIntervalId}`);
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
  },

  checkPredictionStatus: async () => {
    const { predictionId, stopPolling, predictionStartTime } = get(); // Get predictionStartTime

    if (!predictionId) {
      console.log('[Status Check] No prediction ID, stopping.');
      stopPolling();
      set({ isLoading: false }); // Ensure loading is off if no ID
      return;
    }

    // Don't poll if already loading externally (e.g., initial upload)
    // if (useDropAreaStore.getState().isLoading) {
    //   console.log('[Status Check] DropArea is busy, skipping check.');
    //   return;
    // }

    console.log(`[Status Check] Attempting for ID: ${predictionId}`);
    try {
      // Use the new service endpoint
      const url = `/api/audio-service/status/${predictionId}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[Status Check] Result:`, result);

      if (!result) {
        throw new Error('No result data received');
      }

      const currentStatus = result.status as string;
      const logs = result.logs || '';
      const logBasedPercentage = parseProgress(logs);
      let timeBasedPercentage = 0;
      let finalPercentage = logBasedPercentage;
      let progressMessage = statusMessages[currentStatus] || `Status: ${currentStatus}`; // Fallback message

      // --- Time-based Fallback & Timeout ---
      if (predictionStartTime && !['succeeded', 'failed', 'canceled'].includes(currentStatus)) {
        const elapsedTimeMs = Date.now() - predictionStartTime;
        console.log(`[Time Check] Elapsed: ${elapsedTimeMs}ms`);

        // Check for timeout
        if (elapsedTimeMs > MAX_PROCESSING_TIME_MS) {
          console.error(`[Timeout] Prediction ${predictionId} exceeded ${MAX_PROCESSING_TIME_MS}ms.`);
          stopPolling();
          set({
            error: 'Processing timed out. Please try again.',
            isLoading: false,
            predictionStatus: 'failed', // Mark as failed due to timeout
            progress: {
                percentage: get().progress.percentage, // Keep last known percentage
                message: 'Processing timed out.',
                logs: get().progress.logs,
            }
          });
          return; // Stop further processing for this check
        }

        // Calculate time-based percentage (capped at 99% to avoid premature 100%)
        timeBasedPercentage = Math.min(99, Math.floor((elapsedTimeMs / MAX_PROCESSING_TIME_MS) * 100));
        finalPercentage = Math.max(logBasedPercentage, timeBasedPercentage);

        // Optionally adjust message if time-based is significantly ahead or logs are missing
        if (timeBasedPercentage > logBasedPercentage && logBasedPercentage === 0 && currentStatus === 'processing') {
            // Only override if logs provide no info and time suggests progress
             progressMessage = `${statusMessages.processing} (estimating...)`;
        }
      }
      // --- End Time-based ---

      console.log(`[Progress Update] Log: ${logBasedPercentage}%, Time: ${timeBasedPercentage}%, Final: ${finalPercentage}%`);

      // Update the store with status and combined progress
      set({
        predictionStatus: currentStatus,
        progress: {
          percentage: finalPercentage, // Use the blended percentage
          message: progressMessage,
          logs: logs.split('\n'), // Store logs as an array
        }
      });

      // Handle final states
      if (currentStatus === 'succeeded') {
        console.log('Prediction succeeded:', result);
        set({
           finalResult: result.output,
           isLoading: false,
           error: null,
           progress: { // Final progress state
               percentage: 100,
               message: statusMessages.succeeded,
                logs: logs.split('\n'),
            }
        });
        stopPolling();

        // --- Trigger Transcription on Success ---
        // Handle different output structures: Demucs (vocals only) might return a string directly, Fal AI returns an object
        let vocalUrl: string | null = null;
        if (result.output) {
          if (typeof result.output === 'string') {
            // Likely Demucs with stem='vocals', output is the direct URL
            vocalUrl = result.output;
             console.log(`[Transcription Trigger] Demucs vocal isolation succeeded. Vocal URL: ${vocalUrl}`);
          } else if (typeof result.output === 'object' && typeof result.output.vocals === 'string') {
            // Likely Fal AI (Spleeter), output is an object with stem URLs
            vocalUrl = result.output.vocals;
            console.log(`[Transcription Trigger] Fal AI split succeeded. Vocal URL: ${vocalUrl}`);
          }
        }

        if (vocalUrl) {
           // Call the transcription action asynchronously (don't block polling logic)
           get().startTranscription(vocalUrl).catch(transcriptionError => {
               console.error("[Transcription Trigger] Error starting transcription:", transcriptionError);
               set({ transcriptionError: "Failed to initiate transcription process." });
           });
        } else {
             console.warn("[Transcription Trigger] Processing succeeded, but vocal URL not found in expected format in result.output:", result.output);
             set({ transcriptionError: "Processing successful, but couldn't find vocal track URL for transcription.", isTranscribing: false });
        }
        // --- End Transcription Trigger ---

      } else if (currentStatus === 'failed' || currentStatus === 'canceled') {
        console.error(`Prediction ${currentStatus}:`, result);
        set({
          error: result.error || `Prediction ${currentStatus}.`,
          isLoading: false,
          finalResult: null,
           progress: { // Final progress state on failure/cancel
               percentage: get().progress.percentage, // Keep last known percentage or reset? Resetting might be confusing.
               message: statusMessages[currentStatus] || `Prediction ${currentStatus}.`,
               logs: logs.split('\n')
           }
        });
        stopPolling();
      } else {
        // Still processing (starting, processing) - ensure isLoading is true
        if (!get().isLoading) {
           set({ isLoading: true }); // Make sure loading state is active during processing steps
        }
        // Progress is updated via the set call above
      }
    } catch (error) {
      console.error('Status check fetch failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown status check error occurred.';
      set({ error: `Status check failed: ${errorMessage}`, isLoading: false });
      stopPolling();
    }
  },

  // --- New Transcription Action ---
  startTranscription: async (audioUrl) => {
    console.log(`[Transcription] Starting for URL: ${audioUrl}`);
    // Reset formatting state when transcription starts
    set({
      isTranscribing: true,
      rawTranscriptionResult: null, // Renamed
      transcriptionError: null,
      isFormatting: false,
      formattedTranscription: null,
      formattingError: null
    });

    try {
      const response = await fetch('/api/audio-to-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_url: audioUrl }), // Send the required URL
      });

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ // Try to parse error JSON
            message: `HTTP error! status: ${response.status}`
         }));
        throw new Error(errorData.details || errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Assuming the endpoint returns the transcription text directly or within a structure
      // Adjust based on the actual response from controller.cjs -> result.data
      const result = await response.json();
      console.log("[Transcription] Success:", result);

      // Extract the text directly from the result object
      const transcribedText = result?.text;

      if (typeof transcribedText === 'string') {
        console.log("[Transcription] Success, raw text received. Storing and starting formatting.");
        set({
          isTranscribing: false, // Transcription itself is done
          rawTranscriptionResult: transcribedText, // Store raw text internally
          transcriptionError: null,
        });
        // --- Trigger Formatting ---
        get().formatTranscription(transcribedText).catch(formattingError => {
             console.error("[Transcription Flow] Error calling formatTranscription:", formattingError);
             // The formatTranscription action handles its own state updates on error
        });
        // --- End Trigger Formatting ---
      } else {
        // Handle cases where the expected structure is missing
        console.error("[Transcription] Unexpected result structure:", result);
        throw new Error("Received transcription result in an unexpected format.");
      }

    } catch (error) {
      console.error("[Transcription] Failed:", error);
       const errorMessage = error instanceof Error ? error.message : 'An unknown transcription error occurred.';
      set({
        isTranscribing: false,
        rawTranscriptionResult: null, // Corrected from transcriptionResult
        transcriptionError: `Transcription failed: ${errorMessage}`,
      });
    }
  },
  // --- End New Transcription Action ---

  // --- New Formatting Action ---
  formatTranscription: async (textToFormat) => {
      console.log(`[Formatting] Starting for text: "${textToFormat.substring(0, 50)}..."`);
      set({ isFormatting: true, formattedTranscription: null, formattingError: null });

      const prompt = `This is a song lyric. Formate it to better look like a lyric. Dont include sections like [verse] [chorus]:\n\n${textToFormat}`;

      try {
          const response = await fetch('/api/gemini', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ prompt }),
          });

          if (!response.ok) {
              const errorData = await response.json().catch(() => ({
                  message: `HTTP error! status: ${response.status}`
              }));
              throw new Error(errorData.details || errorData.message || `HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          console.log("[Formatting] Success:", result);

          const formattedText = result?.result;

          if (typeof formattedText === 'string') {
              set({
                  isFormatting: false,
                  formattedTranscription: formattedText,
                  formattingError: null,
              });
          } else {
              console.error("[Formatting] Unexpected result structure:", result);
              throw new Error("Received formatting result in an unexpected format.");
          }

      } catch (error) {
          console.error("[Formatting] Failed:", error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown formatting error occurred.';
          set({
              isFormatting: false,
              formattedTranscription: null,
              formattingError: `Formatting failed: ${errorMessage}`,
          });
      }
  },
  // --- End New Formatting Action ---


  uploadAudioAndStartPolling: async () => {
    // Get selected service along with other needed state/actions
    const { checkPredictionStatus, stopPolling, selectedAudioService } = get();
    // **IMPORTANT:** The uploadAudio function in DropAreaStore needs to be updated
    // to accept the service and append it to the URL.
    // We'll assume it's updated for now and pass the service.
    const dropAreaUpload = useDropAreaStore.getState().uploadAudio;

    // Ensure any previous polling is stopped before starting a new upload
    stopPolling();
    // Reset transcription/formatting states as well
    set({
        isLoading: true, // Keep only one isLoading
        predictionId: null,
        predictionStatus: 'uploading', // Set initial status
        finalResult: null,
        error: null,
        progress: { // Reset progress on new upload
          percentage: 0,
          message: statusMessages.uploading, // Show uploading message
          logs: [],
        },
        // Reset transcription/formatting on new upload
        isTranscribing: false,
        rawTranscriptionResult: null,
        transcriptionError: null,
        isFormatting: false,
        formattedTranscription: null,
        formattingError: null,
     });

    try {
       console.log(`[Upload Trigger] Starting upload with service: ${selectedAudioService}`);
       // Call the modified dropAreaUpload, which returns the result or throws error
       const uploadResult = await dropAreaUpload(selectedAudioService);

       console.log("[HomeStore] Received upload result:", uploadResult);

       // Check the structure of the result to determine flow
       if (uploadResult && uploadResult.id) {
          // --- Handle Polling Start (Fal AI) ---
          const newPredictionId = uploadResult.id;
          const initialStatus = uploadResult.status || 'starting';
          console.log(`[HomeStore] Initiating polling for ID: ${newPredictionId}`);
          set({
             predictionId: newPredictionId,
             isLoading: true, // Polling is a loading state
             predictionStatus: initialStatus,
             progress: {
                 percentage: 0,
                 message: statusMessages[initialStatus] || 'Starting...',
                 logs: []
             },
             predictionStartTime: Date.now(), // Record polling start time
             finalResult: null,
             error: null,
          });
          console.log(`[HomeStore] Polling setup complete. Performing initial status check for ID: ${newPredictionId}.`);
          // Perform initial check immediately
          await checkPredictionStatus();
          // Start interval only if not already in a final state after the first check
          const currentState = get();
          if (!['succeeded', 'failed', 'canceled'].includes(currentState.predictionStatus || '') && !pollingIntervalId) {
            pollingIntervalId = setInterval(() => {
              checkPredictionStatus();
            }, 3000) as unknown as number;
            console.log(`[HomeStore] Polling interval started with ID: ${pollingIntervalId}`);
          }

       } else if (uploadResult && uploadResult.output) {
          // --- Handle Direct Result (Demucs) ---
          const directFinalResult = uploadResult.output;
          console.log("[HomeStore] Received direct result:", directFinalResult);
          set({
            isLoading: false, // Processing is finished
            predictionId: null, // No polling needed
            predictionStatus: 'succeeded',
            finalResult: directFinalResult,
            error: null,
            progress: { percentage: 100, message: statusMessages.succeeded, logs: [] },
            predictionStartTime: null,
          });
          console.log("[HomeStore] State updated with direct result. Triggering transcription...");
          // Trigger transcription immediately
          if (typeof directFinalResult === 'string') {
             get().startTranscription(directFinalResult).catch(transcriptionError => {
               console.error("[HomeStore] Error starting transcription for direct result:", transcriptionError);
               set({ transcriptionError: "Failed to initiate transcription process." });
             });
          } else {
             // This case should ideally not happen based on backend logic, but handle defensively
             console.warn("[HomeStore] Direct result received but is not a string:", directFinalResult);
             set({ transcriptionError: "Processing successful, but couldn't find vocal track URL for transcription.", isTranscribing: false });
          }
       } else {
          // Handle unexpected result structure from dropAreaUpload
          console.error("[HomeStore] Unexpected result structure after upload:", uploadResult);
          throw new Error("Received unexpected response after upload.");
       }

    } catch (caughtError) {
        // Error thrown by dropAreaUpload or subsequent processing
        console.error("[HomeStore] Error during uploadAudioAndStartPolling:", caughtError);
        const errorMessage = caughtError instanceof Error ? caughtError.message : 'An unknown error occurred during upload/processing.';
        set({ error: `Processing failed: ${errorMessage}`, isLoading: false, predictionStatus: 'failed' });
        stopPolling(); // Ensure polling is stopped
    }
  },

  clearPrediction: () => {
    const { stopPolling } = get();
    // Get the action directly from the store instance
    const clearDropAreaFiles = useDropAreaStore.getState().clearFiles;

    console.log('[Clear] Clearing prediction state and stopping polling.');
    stopPolling();
    clearDropAreaFiles(); // Call the action to clear DropArea state
    set({
      isLoading: false,
      predictionId: null,
      predictionStatus: null,
      finalResult: null,
      error: null,
      progress: { // Reset progress on clear
          percentage: 0,
          message: '',
          logs: []
      },
      predictionStartTime: null, // Reset start time on clear
      // Reset transcription state on clear
      isTranscribing: false,
      rawTranscriptionResult: null, // Renamed
      transcriptionError: null,
      // Reset formatting state on clear (New)
      isFormatting: false,
      formattedTranscription: null,
      formattingError: null,
    });
    // Ensure DropArea state is also cleared
    useDropAreaStore.setState({
      predictionId: null,
      error: null,
      isLoading: false,
      // droppedFiles: [], // Assuming DropAreaStore manages its files
    });

  },

}));

// Optional: Subscribe to DropAreaStore changes to keep HomeStore in sync if needed,
// although actions might be a cleaner way to manage the relationship.
// Example: Sync isLoading and error back from DropAreaStore if it changes independently
/*
useDropAreaStore.subscribe(
  (state) => [state.isLoading, state.error, state.predictionId],
  ([isLoading, error, predictionId]) => {
    console.log("[Sync] DropAreaStore changed:", { isLoading, error, predictionId });
    const homeState = useHomeStore.getState();
    // Only sync if Home isn't already managing its own loading/error cycle for polling
    // This logic can get complex, prefer direct action calls if possible.
    if (homeState.predictionId === predictionId) { // Only sync if relevant prediction
        if (homeState.isLoading !== isLoading && !pollingIntervalId) { // Avoid overriding polling loading state
             useHomeStore.setState({ isLoading });
        }
         if (homeState.error !== error) {
             useHomeStore.setState({ error });
         }
    } else if (!predictionId && homeState.predictionId) {
        // DropArea cleared its prediction ID, maybe Home should clear too?
        // homeState.clearPrediction(); // This could cause loops, be careful.
    }
  },
  { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] }
);
*/

// Helper function (if needed for component initialization, though not strictly required by rules if logic starts via actions)
// export function initHome(): void {
//   // Perform any initial setup for the home page logic if necessary
//   console.log("Initializing Home logic from Script.ts");
//   // Example: Maybe check initial status if a predictionId exists from a previous session?
//   const { predictionId, checkPredictionStatus } = useHomeStore.getState();
//   if (predictionId) {
//      console.log("Found existing prediction ID on init:", predictionId);
//      // checkPredictionStatus(); // Decide if auto-polling should start on load
//   }
// }

// Helper to determine button appearance based on state
export const getButtonState = (isLoading: boolean, status: string | null) => {
  // Default state: Ready to start
  if (!isLoading && !status) {
    return { text: 'Start', color: 'blue', loading: false, disabled: false };
  }

  // Loading states
  if (isLoading) {
    switch (status) {
      case 'uploading':
        return { text: 'Uploading...', color: 'blue', loading: true, disabled: true };
      case 'processing':
      case 'starting': // Added based on Replicate docs
        return { text: 'Processing...', color: 'yellow', loading: true, disabled: true };
      // Add other potential Replicate statuses if needed: 'output_file_present', 'webhook_processing' etc.
      default:
        // Covers null status during initial load or unknown statuses during polling
        return { text: 'Loading...', color: 'blue', loading: true, disabled: true };
    }
  }

  // Final non-loading states (should ideally be handled by finalResult, but status might persist briefly)
  // We don't show the Start button when there's a final result, so these shouldn't typically be hit for the Start button itself.
  // They might be relevant if we adapted this for a general status display.
  // switch (status) {
  //   case 'succeeded':
  //     return { text: 'Completed', color: 'green', loading: false, disabled: true }; // Start button wouldn't show here
  //   case 'failed':
  //   case 'canceled':
  //     return { text: 'Failed', color: 'red', loading: false, disabled: true }; // Start button wouldn't show here
  // }

  // Fallback for unexpected non-loading states
  return { text: 'Start', color: 'blue', loading: false, disabled: false };
};
