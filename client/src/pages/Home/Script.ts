import { create } from 'zustand';
import { useDropAreaStore } from '../../components/DropArea/Script';

export interface HomeState {
  isLoading: boolean; // Tracks the overall upload & processing state
  error: string | null; // Stores errors from the upload/processing step
  processedLyrics: string | null; // Stores the final formatted lyrics from Gemini

  // Actions
  uploadAndProcessAudio: () => Promise<void>;
  clearResult: () => void;
}

// Helper function (optional, if needed)
// const someHelper = () => { ... };

export const useHomeStore = create<HomeState>((set) => ({
  // Initial state
  isLoading: false,
  error: null,
  processedLyrics: null,

  // Define actions implementations
  uploadAndProcessAudio: async () => {
    // Set loading state and clear previous results/errors
    set({ isLoading: true, error: null, processedLyrics: null });

    try {
      // Get the upload function from the DropArea store
      const uploadAudio = useDropAreaStore.getState().uploadAudio;
      // Call the upload function which now returns the lyrics string
      const lyrics = await uploadAudio();

      // Success: Update state with the result
      set({ isLoading: false, processedLyrics: lyrics, error: null });
      console.log('Upload and processing successful.');

    } catch (error) {
      // Error: Update state with the error message
      console.error('[HomeStore] Error during upload/processing:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      set({ isLoading: false, error: errorMessage, processedLyrics: null });
    }
  },

  clearResult: () => {
    // Reset state and call clearFiles in DropAreaStore
    const clearDropAreaFiles = useDropAreaStore.getState().clearFiles;
    clearDropAreaFiles(); // Clear files in the DropArea store
    set({
      isLoading: false,
      error: null,
      processedLyrics: null,
    });
    console.log('[HomeStore] Result cleared.');
  },

}));

// Optional: Subscribe to DropAreaStore if needed for secondary effects,
// but the primary flow is initiated from HomeStore calling DropArea's upload.
/*
useDropAreaStore.subscribe(
  (state) => [state.isLoading, state.error],
  ([isLoading, error]) => {
    const homeState = useHomeStore.getState();
    // Maybe update Home's loading/error state if DropArea changes independently?
    // Careful with potential loops. Generally, HomeStore should control the overall process.
    if (isLoading !== homeState.isLoading) {
      // useHomeStore.setState({ isLoading }); // Be cautious with this
    }
    if (error && error !== homeState.error) {
      // useHomeStore.setState({ error }); // Be cautious
    }
  },
  { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] }
);
*/
