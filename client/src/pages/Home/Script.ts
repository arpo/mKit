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

  // Transcription State
  isTranscribing: boolean;
  transcriptionResult: string | null;
  transcriptionError: string | null;

  // Actions
  uploadAudioAndStartPolling: () => Promise<void>;
  startTranscription: (audioUrl: string) => Promise<void>; // New action
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
  starting: 'Booting...',
  processing: 'Splitting audio tracks...',
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

  // Transcription State Initialization
  isTranscribing: false,
  transcriptionResult: null,
  transcriptionError: null,

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
      const url = `/api/audio-split/status/${predictionId}`;
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
        // Assuming result.output contains the URLs
        if (result.output && typeof result.output.vocals === 'string') {
           console.log(`[Transcription Trigger] Audio split succeeded. Vocal URL: ${result.output.vocals}`);
           // Call the transcription action asynchronously (don't block polling logic)
           get().startTranscription(result.output.vocals).catch(transcriptionError => {
               console.error("[Transcription Trigger] Error starting transcription:", transcriptionError);
               // Optionally update state if the trigger itself fails, though startTranscription handles its own errors
               set({ transcriptionError: "Failed to initiate transcription process." });
           });
        } else {
             console.warn("[Transcription Trigger] Audio split succeeded, but vocal URL not found in expected format in result.output:", result.output);
             // Set an error state specific to transcription start failure due to missing URL
             set({ transcriptionError: "Audio split successful, but couldn't find vocal track URL for transcription.", isTranscribing: false });
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
    set({ isTranscribing: true, transcriptionResult: null, transcriptionError: null });

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
        set({
          isTranscribing: false,
          transcriptionResult: transcribedText,
          transcriptionError: null,
        });
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
        transcriptionResult: null,
        transcriptionError: `Transcription failed: ${errorMessage}`,
      });
    }
  },
  // --- End New Transcription Action ---

  uploadAudioAndStartPolling: async () => {
    const { checkPredictionStatus, stopPolling } = get();
    const dropAreaUpload = useDropAreaStore.getState().uploadAudio;
    

    // Ensure any previous polling is stopped before starting a new upload
    stopPolling();
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
        }
     });

    try {
       // Trigger the upload using the DropAreaStore's action
       await dropAreaUpload(); // This should set predictionId in DropAreaStore

       // Sync predictionId from DropAreaStore to HomeStore after upload finishes
       const newPredictionId = useDropAreaStore.getState().predictionId;
       const uploadError = useDropAreaStore.getState().error;

       if(uploadError){
         console.error("Upload failed via DropAreaStore:", uploadError);
         set({ error: `Upload failed: ${uploadError}`, isLoading: false, predictionStatus: 'failed' });
         return; // Don't start polling if upload failed
       }

       if (!newPredictionId) {
         console.error("Upload completed but no prediction ID received from DropAreaStore.");
         set({ error: "Upload finished but failed to get a prediction ID.", isLoading: false, predictionStatus: 'failed' });
         return; // Don't start polling if no ID
       }

       // Successfully got ID, move to processing state
       set({
          predictionId: newPredictionId,
          isLoading: true,
          predictionStatus: 'processing', // Or 'starting' if Replicate uses that first
          progress: {
              percentage: 0, // Keep at 0 until first status check returns logs
              message: statusMessages.starting || statusMessages.processing, // Show appropriate message
              logs: []
          },
          predictionStartTime: Date.now(), // Record start time *before* first check
       });

       console.log(`[Polling] Starting for ID: ${newPredictionId}. Start time: ${get().predictionStartTime}`);

       // Perform initial check immediately
       await checkPredictionStatus();

       // Start interval only if not already in a final state after the first check
       const currentState = get();
       if (!['succeeded', 'failed', 'canceled'].includes(currentState.predictionStatus || '') && !pollingIntervalId) {
         pollingIntervalId = setInterval(() => {
           checkPredictionStatus();
         }, 3000) as unknown as number; // Poll every 3 seconds
         console.log(`Polling started with interval ID: ${pollingIntervalId}`);
       }

    } catch (uploadError) {
        // This catch might be redundant if dropAreaUpload handles its errors internally
        // and sets the error state in DropAreaStore, which we checked above.
        console.error("Error during uploadAudioAndStartPolling:", uploadError);
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'An unknown upload error occurred.';
        set({ error: `Upload initiation failed: ${errorMessage}`, isLoading: false, predictionStatus: 'failed' });
        stopPolling(); // Ensure polling is stopped on error
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
      transcriptionResult: null,
      transcriptionError: null,
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
    return { text: 'Start Splitting', color: 'blue', loading: false, disabled: false };
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
  return { text: 'Start Splitting', color: 'blue', loading: false, disabled: false };
};
