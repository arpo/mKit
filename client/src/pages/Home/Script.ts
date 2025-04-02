import { create } from 'zustand';
import { useDropAreaStore } from '../../components/DropArea/Script';

// Keep track of the polling interval outside the store state if needed,
// or manage it within an effect inside the store if using middleware.
// For simplicity here, we manage it via actions.
let pollingIntervalId: number | null = null;

export interface HomeState {
  isLoading: boolean;
  predictionId: string | null;
  predictionStatus: string | null;
  finalResult: Record<string, string> | null; // Assuming object structure based on Home.tsx
  error: string | null;

  // Actions
  uploadAudioAndStartPolling: () => Promise<void>;
  clearPrediction: () => void;
  checkPredictionStatus: () => Promise<void>; // Made explicit action
  stopPolling: () => void; // Explicit action to stop
}

export const useHomeStore = create<HomeState>((set, get) => ({
  // Initial state - mirror relevant parts from DropAreaStore or keep separate
  isLoading: useDropAreaStore.getState().isLoading,
  predictionId: useDropAreaStore.getState().predictionId,
  predictionStatus: null, // Home manages its own polling status view
  finalResult: null,
  error: useDropAreaStore.getState().error,

  stopPolling: () => {
    if (pollingIntervalId) {
      console.log(`[Polling] Clearing interval ID: ${pollingIntervalId}`);
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
  },

  checkPredictionStatus: async () => {
    const { predictionId, stopPolling } = get();

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

      set({ predictionStatus: result.status }); // Update status in store

      if (result.status === 'succeeded') {
        console.log('Prediction succeeded:', result);
        set({ finalResult: result.output, isLoading: false, error: null });
        stopPolling();
      } else if (result.status === 'failed' || result.status === 'canceled') {
        console.error('Prediction failed/canceled:', result);
        set({
          error: result.error || `Prediction ${result.status}.`,
          isLoading: false,
          finalResult: null, // Clear results on failure
        });
        stopPolling();
      } else {
        // Still processing, ensure loading is true if not already set by initial upload
        if (!get().isLoading) {
           // Only set loading if not already loading from upload
           // This might need refinement based on how DropArea handles its loading state
           set({ isLoading: true });
        }
      }
    } catch (error) {
      console.error('Status check fetch failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown status check error occurred.';
      set({ error: `Status check failed: ${errorMessage}`, isLoading: false });
      stopPolling();
    }
  },

  uploadAudioAndStartPolling: async () => {
    const { checkPredictionStatus, stopPolling } = get();
    const dropAreaUpload = useDropAreaStore.getState().uploadAudio;
    const dropAreaClear = useDropAreaStore.getState().clearFiles;

    // Ensure any previous polling is stopped before starting a new upload
    stopPolling();
    set({
        isLoading: true,
        predictionId: null,
        predictionStatus: 'uploading',
        finalResult: null,
        error: null,
     }); // Reset state for new upload

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


       set({ predictionId: newPredictionId, isLoading: true, predictionStatus: 'processing' }); // Update HomeStore state

       console.log(`[Polling] Starting for ID: ${newPredictionId}`);

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
    const dropAreaClear = useDropAreaStore.getState().clearFiles;

    console.log('[Clear] Clearing prediction state and stopping polling.');
    stopPolling();
    dropAreaClear(); // Clear DropArea state as well
    set({
      isLoading: false,
      predictionId: null,
      predictionStatus: null,
      finalResult: null,
      error: null,
      // Need to clear droppedFiles too? Home doesn't own it, DropArea does.
      // Maybe DropArea should expose a full reset? For now, clear Home state.
    });
    // Ensure DropArea state is also cleared if necessary, DropArea's clearFiles should handle its state.
     useDropAreaStore.setState({ predictionId: null, error: null, isLoading: false /* any other relevant DropArea state */ });

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
